import 'reflect-metadata';
import type { ClientProxy } from '@nestjs/microservices';
import {
  DEFAULT_TRACKING_CONFIG,
  SETTINGS_RESOLVE_GROUP,
  TRACKING_GROUP,
  trackingDestinationSettingKeys,
} from '@sanad/contracts';
import { DEFAULT_REQUEST_TIMEOUT_MS } from '@sanad/messaging';
import { NEVER, of, throwError } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { TrackingController } from './tracking.controller.js';

function client(values: Record<string, unknown>) {
  const send = vi.fn().mockReturnValue(of(values));
  return { proxy: { send } as unknown as ClientProxy, send };
}

function brokenClient() {
  const send = vi.fn().mockReturnValue(throwError(() => new Error('no route')));
  return { proxy: { send } as unknown as ClientProxy, send };
}

const ga4 = trackingDestinationSettingKeys('ga4');

describe('GET /api/tracking-config', () => {
  it('asks settings for the whole tracking group', async () => {
    const { proxy, send } = client({});
    await new TrackingController(proxy).get('ar');
    expect(send.mock.calls[0]?.[0]).toBe(SETTINGS_RESOLVE_GROUP);
    expect(send.mock.calls[0]?.[1]?.data).toEqual({ group: TRACKING_GROUP });
  });

  it('serves the assembled config for a configured destination', async () => {
    const { proxy } = client({
      [ga4.enabled]: true,
      [ga4.id]: 'G-ABCDE12345',
    });
    const config = await new TrackingController(proxy).get('ar');
    expect(config.destinations).toEqual([
      { id: 'ga4', category: 'analytics', measurementId: 'G-ABCDE12345' },
    ]);
  });

  /**
   * The endpoint is on the render path of every public page. If it threw when settings-service
   * were down, the whole site would 500 for the sake of a pixel — so an unreachable broker
   * collapses to the same safe answer as "nothing is configured": consent still asked, no tag
   * loaded (U23 degraded, U30b).
   */
  it('serves the coded defaults — never an error — when settings is unreachable', async () => {
    const { proxy } = brokenClient();
    await expect(new TrackingController(proxy).get('ar')).resolves.toEqual(
      DEFAULT_TRACKING_CONFIG,
    );
  });

  /**
   * Found by the runtime gate, not by a unit test: with settings-service stopped the endpoint
   * still answered 200 — but only after **5.05 s**, `sendRequest`'s default. This route is
   * public and sits on the render path of every page, so a settings outage would add five
   * seconds to every cold render. A consent policy is not worth that: if settings cannot
   * answer quickly, the coded default IS the right answer.
   */
  it('gives up FAR inside the default RMQ budget when settings does not answer', async () => {
    vi.useFakeTimers();
    try {
      const send = vi.fn().mockReturnValue(NEVER);
      const resolved = new TrackingController({
        send,
      } as unknown as ClientProxy).get('ar');
      await vi.advanceTimersByTimeAsync(DEFAULT_REQUEST_TIMEOUT_MS / 2);
      await expect(resolved).resolves.toEqual(DEFAULT_TRACKING_CONFIG);
    } finally {
      vi.useRealTimers();
    }
  });

  it('is PUBLIC — no guard stands between an anonymous visitor and the banner policy', () => {
    // A guarded route here would mean the consent banner could not render for the very
    // visitors it exists to ask.
    const guards: unknown[] =
      Reflect.getMetadata('__guards__', TrackingController) ?? [];
    const handlerGuards: unknown[] =
      Reflect.getMetadata('__guards__', TrackingController.prototype.get) ?? [];
    expect(guards).toEqual([]);
    expect(handlerGuards).toEqual([]);
  });
});
