import {
  RATE_LIMIT_DEFAULTS,
  SECURITY_SETTING_KEYS,
  SETTINGS_RESOLVE_GROUP,
} from '@sanad/contracts';
import type { ClientProxy } from '@nestjs/microservices';
import type { DateTimeService } from '@sanad/database';
import { of, throwError } from 'rxjs';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RATE_LIMIT_SETTINGS_TTL_MS } from '../../rate-limit.constants.js';
import { RateLimitPolicyResolver } from './rate-limit-policies.resolver.js';

/** A fake clock matching `DateTimeService`'s surface, so the TTL is driven, not waited on. */
function fakeClock(): {
  clock: DateTimeService;
  advance(ms: number): void;
} {
  let now = 1_000_000;
  return {
    clock: { nowMillis: () => now } as unknown as DateTimeService,
    advance: (ms) => {
      now += ms;
    },
  };
}

function replyingClient(values: Record<string, unknown>) {
  const send = vi.fn().mockReturnValue(of(values));
  return { client: { send } as unknown as ClientProxy, send };
}

function failingClient() {
  const send = vi.fn().mockReturnValue(throwError(() => new Error('no route')));
  return { client: { send } as unknown as ClientProxy, send };
}

/** `current()` is synchronous; a refresh is scheduled, so let the microtask queue drain. */
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('RateLimitPolicyResolver', () => {
  let time: ReturnType<typeof fakeClock>;

  beforeEach(() => {
    time = fakeClock();
  });

  // Cold start must never block the very first request on an RMQ round trip, and must never
  // throw — a limiter that dies because settings is down has become the outage.
  it('serves the coded defaults when the broker has never answered', () => {
    const { client } = failingClient();
    const resolver = new RateLimitPolicyResolver(client, time.clock);
    expect(resolver.current()).toEqual({
      enabled: true,
      policies: RATE_LIMIT_DEFAULTS,
    });
  });

  it('is synchronous — it returns a snapshot, never a promise', () => {
    const { client } = replyingClient({});
    const resolver = new RateLimitPolicyResolver(client, time.clock);
    expect(resolver.current()).not.toBeInstanceOf(Promise);
  });

  it('asks settings for the whole security group, once', async () => {
    const { client, send } = replyingClient({});
    const resolver = new RateLimitPolicyResolver(client, time.clock);
    resolver.current();
    await settle();
    expect(send).toHaveBeenCalledTimes(1);
    expect(send.mock.calls[0]?.[0]).toBe(SETTINGS_RESOLVE_GROUP);
    expect(send.mock.calls[0]?.[1]?.data).toEqual({ group: 'security' });
  });

  it('reflects a resolved value once the refresh has landed', async () => {
    const { client } = replyingClient({
      [SECURITY_SETTING_KEYS.leadLimit]: 3,
    });
    const resolver = new RateLimitPolicyResolver(client, time.clock);
    resolver.current();
    await settle();
    expect(resolver.current().policies.lead.limit).toBe(3);
  });

  it('re-resolves only after the TTL lapses, not once per request', async () => {
    const { client, send } = replyingClient({});
    const resolver = new RateLimitPolicyResolver(client, time.clock);
    for (let i = 0; i < 100; i += 1) {
      resolver.current();
    }
    await settle();
    expect(send).toHaveBeenCalledTimes(1);

    time.advance(RATE_LIMIT_SETTINGS_TTL_MS + 1);
    resolver.current();
    await settle();
    expect(send).toHaveBeenCalledTimes(2);
  });

  it('keeps the last good snapshot when a later resolve fails', async () => {
    const send = vi
      .fn()
      .mockReturnValueOnce(of({ [SECURITY_SETTING_KEYS.leadLimit]: 7 }))
      .mockReturnValue(throwError(() => new Error('broker down')));
    const resolver = new RateLimitPolicyResolver(
      { send } as unknown as ClientProxy,
      time.clock,
    );
    resolver.current();
    await settle();
    expect(resolver.current().policies.lead.limit).toBe(7);

    time.advance(RATE_LIMIT_SETTINGS_TTL_MS + 1);
    resolver.current();
    await settle();
    // Not 20 (the coded default) — the last value an operator actually chose still stands.
    expect(resolver.current().policies.lead.limit).toBe(7);
  });

  // F7: null-safe to the leaf. A group that has only ever been half-written must not leave the
  // other policies undefined.
  it('fills every key the group did not carry from the coded default', async () => {
    const { client } = replyingClient({
      [SECURITY_SETTING_KEYS.leadLimit]: 3,
    });
    const resolver = new RateLimitPolicyResolver(client, time.clock);
    resolver.current();
    await settle();
    const { policies } = resolver.current();
    expect(policies.lead.windowSeconds).toBe(
      RATE_LIMIT_DEFAULTS.lead.windowSeconds,
    );
    expect(policies.auth).toEqual(RATE_LIMIT_DEFAULTS.auth);
    expect(policies.default).toEqual(RATE_LIMIT_DEFAULTS.default);
  });

  // An admin typo must degrade to the default, never lock the product out.
  it.each([
    ['zero', 0],
    ['negative', -5],
    ['a string', 'ten'],
    ['null', null],
    ['a localized object', { ar: 'ه', en: 'x' }],
  ])(
    'ignores %s as a limit and keeps the coded default',
    async (_label, bad) => {
      const { client } = replyingClient({
        [SECURITY_SETTING_KEYS.leadLimit]: bad,
      });
      const resolver = new RateLimitPolicyResolver(client, time.clock);
      resolver.current();
      await settle();
      expect(resolver.current().policies.lead.limit).toBe(
        RATE_LIMIT_DEFAULTS.lead.limit,
      );
    },
  );

  it('ignores a window outside the sane bounds', async () => {
    const { client } = replyingClient({
      [SECURITY_SETTING_KEYS.leadWindowSeconds]: 999_999,
    });
    const resolver = new RateLimitPolicyResolver(client, time.clock);
    resolver.current();
    await settle();
    expect(resolver.current().policies.lead.windowSeconds).toBe(
      RATE_LIMIT_DEFAULTS.lead.windowSeconds,
    );
  });

  it('honours the kill switch', async () => {
    const { client } = replyingClient({
      [SECURITY_SETTING_KEYS.enabled]: false,
    });
    const resolver = new RateLimitPolicyResolver(client, time.clock);
    resolver.current();
    await settle();
    expect(resolver.current().enabled).toBe(false);
  });
});
