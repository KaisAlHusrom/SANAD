import { describe, expect, it, vi } from 'vitest';
import { NEVER, of, throwError } from 'rxjs';
import type { ClientProxy } from '@nestjs/microservices';
import { DEFAULT_REQUEST_TIMEOUT_MS } from '@sanad/messaging';
import {
  LEAD_DEDUP_DEFAULTS,
  LEAD_DEDUP_SETTING_KEYS,
  SECURITY_GROUP,
  SETTINGS_RESOLVE_GROUP,
} from '@sanad/contracts';
import { LeadDedupSettingsResolver } from './lead-dedup-settings.resolver.js';

/** A fake `ClientProxy.send`, typed so the call assertions below are checked, not `any`. */
type Send = (pattern: string, payload: unknown) => unknown;

function resolverWith(send: Send) {
  return new LeadDedupSettingsResolver({ send } as unknown as ClientProxy);
}

describe('LeadDedupSettingsResolver', () => {
  it('asks the settings service for the whole security group (MS2)', async () => {
    const send = vi.fn<Send>(() => of({}));
    await resolverWith(send).current();
    expect(send.mock.calls[0]?.[0]).toBe(SETTINGS_RESOLVE_GROUP);
  });

  it('reads the operator’s values', async () => {
    const send = vi.fn<Send>(() =>
      of({
        [LEAD_DEDUP_SETTING_KEYS.enabled]: false,
        [LEAD_DEDUP_SETTING_KEYS.windowSeconds]: 3600,
      }),
    );
    expect(await resolverWith(send).current()).toEqual({
      enabled: false,
      windowSeconds: 3600,
    });
  });

  it('FAILS OPEN to the coded defaults when settings is unreachable', async () => {
    const send = vi.fn<Send>(() => throwError(() => new Error('no responder')));
    expect(await resolverWith(send).current()).toEqual(LEAD_DEDUP_DEFAULTS);
  });

  it('ignores a value outside its declared bounds, per key', async () => {
    const send = vi.fn<Send>(() =>
      of({
        [LEAD_DEDUP_SETTING_KEYS.enabled]: true,
        [LEAD_DEDUP_SETTING_KEYS.windowSeconds]: 0,
      }),
    );
    const resolved = await resolverWith(send).current();
    expect(resolved.windowSeconds).toBe(LEAD_DEDUP_DEFAULTS.windowSeconds);
    expect(resolved.enabled).toBe(true);
  });

  it('ignores a non-integer or non-boolean value rather than trusting it', async () => {
    const send = vi.fn<Send>(() =>
      of({
        [LEAD_DEDUP_SETTING_KEYS.enabled]: 'yes',
        [LEAD_DEDUP_SETTING_KEYS.windowSeconds]: 90.5,
      }),
    );
    expect(await resolverWith(send).current()).toEqual(LEAD_DEDUP_DEFAULTS);
  });

  it('gives up FAR inside the gateway’s own budget for the submit it sits in', async () => {
    // At `sendRequest`'s 5s default, an unreachable settings-service ate the gateway's whole
    // budget for `content.lead.submit`: the lead was SAVED and the visitor still got a 500,
    // so they would resubmit. Found by running it, not by a unit test — pinned here now.
    vi.useFakeTimers();
    try {
      const send = vi.fn<Send>(() => NEVER);
      const resolved = resolverWith(send).current();
      await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS / 2);
      await expect(resolved).resolves.toEqual(LEAD_DEDUP_DEFAULTS);
    } finally {
      vi.useRealTimers();
    }
  });

  it('resolves the group by name, so an unrelated group cannot answer it', async () => {
    const send = vi.fn<Send>(() => of({}));
    await resolverWith(send).current();
    // `sendRequest` wraps the payload in an RmqRecord — the group rides in `.data`.
    const record = send.mock.calls[0]?.[1] as { data: unknown } | undefined;
    expect(record?.data).toEqual({ group: SECURITY_GROUP });
  });
});
