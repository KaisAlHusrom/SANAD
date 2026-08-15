import { describe, expect, it } from 'vitest';
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

function run(request: FakeRequest, work: () => void): void {
  requestContextMiddleware(
    request as unknown as Parameters<typeof requestContextMiddleware>[0],
    {} as Parameters<typeof requestContextMiddleware>[1],
    work,
  );
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

  it('prefers the FIRST x-forwarded-for hop — the client, not our own nginx', () => {
    run(
      {
        ip: '172.18.0.5',
        headers: { 'x-forwarded-for': '85.10.1.4, 172.18.0.5' },
      },
      () => {
        expect(currentRequestContext().ip).toBe('85.10.1.4');
      },
    );
  });

  it('nulls a missing field instead of inventing one — P8.10 fills the request id', () => {
    run({ headers: {} }, () => {
      expect(currentRequestContext()).toEqual(EMPTY_REQUEST_CONTEXT);
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
