import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_TRACKING_CONFIG } from '@sanad/contracts';
import { getTrackingConfig } from './tracking';

const calls: Array<{ url: string; init?: RequestInit }> = [];

function stub(response: Response | (() => never)) {
  calls.length = 0;
  vi.stubGlobal(
    'fetch',
    vi.fn(async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (typeof response === 'function') response();
      return response;
    }),
  );
}

function ok(data: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => ({ success: true, message: 'ok', data }),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('getTrackingConfig', () => {
  it('reads the public tracking config and caches it under its own tag', async () => {
    const config = {
      ...DEFAULT_TRACKING_CONFIG,
      destinations: [
        { id: 'ga4', category: 'analytics', measurementId: 'G-ABCDE12345' },
      ],
    };
    stub(ok(config));

    await expect(getTrackingConfig()).resolves.toEqual(config);
    expect(calls[0]?.url).toContain('/tracking-config');
    const next = (calls[0]?.init as { next?: { tags?: string[] } } | undefined)
      ?.next;
    expect(next?.tags).toEqual(['tracking']);
  });

  /**
   * Every public page renders this. A throw here would 500 the site for the sake of a pixel,
   * so a dead gateway degrades to the coded defaults — consent still asked, no tag loaded.
   */
  it('degrades to the coded defaults when the gateway cannot answer', async () => {
    stub(() => {
      throw new Error('ECONNREFUSED');
    });
    await expect(getTrackingConfig()).resolves.toEqual(DEFAULT_TRACKING_CONFIG);
  });

  it('degrades on a non-2xx response too, not only on a dead socket', async () => {
    stub({ ok: false, status: 503 } as unknown as Response);
    await expect(getTrackingConfig()).resolves.toEqual(DEFAULT_TRACKING_CONFIG);
  });
});
