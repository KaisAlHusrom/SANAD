import { describe, expect, it, vi } from 'vitest';
import { EMPTY_REQUEST_CONTEXT, REQUEST_ID_HEADER } from '@sanad/contracts';
import {
  currentRequestContext,
  requestContextMiddleware,
} from './request-context.middleware.js';

interface FakeRequest {
  ip?: string;
  socket?: { remoteAddress?: string };
  headers: Record<string, string | string[] | undefined>;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

function run(
  request: FakeRequest,
  work: () => void,
): { setHeader: ReturnType<typeof vi.fn> } {
  const response = { setHeader: vi.fn() };
  requestContextMiddleware(
    request as unknown as Parameters<typeof requestContextMiddleware>[0],
    response as unknown as Parameters<typeof requestContextMiddleware>[1],
    work,
  );
  return response;
}

describe('requestContextMiddleware', () => {
  it('captures ip, user-agent and an inbound request id for the whole request', () => {
    run(
      {
        ip: '85.10.1.4',
        headers: { 'user-agent': 'Mozilla/5.0', [REQUEST_ID_HEADER]: 'req-7' },
      },
      () => {
        expect(currentRequestContext()).toEqual({
          ip: '85.10.1.4',
          userAgent: 'Mozilla/5.0',
          requestId: 'req-7',
        });
      },
    );
  });

  it('falls back to the socket address when Express has no `ip` (no trust proxy)', () => {
    run({ socket: { remoteAddress: '10.0.0.9' }, headers: {} }, () => {
      expect(currentRequestContext().ip).toBe('10.0.0.9');
    });
  });

  /**
   * P8.10.A inverted this. nginx APPENDS to x-forwarded-for, so the first hop is whatever the
   * caller sent — the previous "prefer the first hop" rule handed an attacker a fresh rate-limit
   * bucket per request. Under `trust proxy` Express resolves `req.ip` to the rightmost entry the
   * chain did not add, which is the value that cannot be forged.
   */
  it('prefers the proxy-computed req.ip over a caller-supplied x-forwarded-for hop', () => {
    run(
      {
        ip: '85.10.1.4',
        headers: { 'x-forwarded-for': '9.9.9.9, 85.10.1.4' },
      },
      () => {
        expect(currentRequestContext().ip).toBe('85.10.1.4');
      },
    );
  });

  it('still reads the forwarded chain when Express computed no ip at all', () => {
    run({ headers: { 'x-forwarded-for': '85.10.1.4, 172.18.0.5' } }, () => {
      expect(currentRequestContext().ip).toBe('85.10.1.4');
    });
  });

  it('generates a request id when none arrives, rather than leaving the trail unlinkable', () => {
    run({ headers: {} }, () => {
      const context = currentRequestContext();
      expect(context.requestId).toMatch(UUID);
      expect({ ...context, requestId: null }).toEqual(EMPTY_REQUEST_CONTEXT);
    });
  });

  // How the audit interceptor's HTTP branch — which reads the REQUEST, not the ALS — sees the
  // id we just minted.
  it('stamps the id back onto the request headers', () => {
    const request: FakeRequest = { headers: {} };
    run(request, () => {
      expect(request.headers[REQUEST_ID_HEADER]).toBe(
        currentRequestContext().requestId,
      );
    });
  });

  it('echoes the id on the response so a caller can quote it in a bug report', () => {
    let seen: string | null = null;
    const response = run({ headers: {} }, () => {
      seen = currentRequestContext().requestId;
    });
    expect(response.setHeader).toHaveBeenCalledWith(REQUEST_ID_HEADER, seen);
  });

  // The id reaches DB rows and log lines, so a caller-supplied one is sanitised, not trusted.
  it('replaces an inbound id that is too long or oddly shaped', () => {
    run({ headers: { [REQUEST_ID_HEADER]: 'a'.repeat(129) } }, () => {
      expect(currentRequestContext().requestId).toMatch(UUID);
    });
    run({ headers: { [REQUEST_ID_HEADER]: '<script>' } }, () => {
      expect(currentRequestContext().requestId).toMatch(UUID);
    });
  });

  it('reads EMPTY outside any request — a boot-time or cron call is not a lie about a caller', () => {
    expect(currentRequestContext()).toEqual(EMPTY_REQUEST_CONTEXT);
  });

  it('keeps concurrent requests apart', async () => {
    const seen: string[] = [];
    await Promise.all(
      ['a', 'b'].map(
        (id) =>
          new Promise<void>((resolve) => {
            run({ ip: `1.1.1.${id === 'a' ? 1 : 2}`, headers: {} }, () => {
              setTimeout(
                () => {
                  seen.push(currentRequestContext().ip ?? 'none');
                  resolve();
                },
                id === 'a' ? 10 : 1,
              );
            });
          }),
      ),
    );
    expect(seen.sort()).toEqual(['1.1.1.1', '1.1.1.2']);
  });
});
