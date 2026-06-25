import { configureStore } from '@reduxjs/toolkit';
import type { BaseQueryApi } from '@reduxjs/toolkit/query';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  authReducer,
  selectAccessToken,
  tokensReceived,
} from '../auth/auth.slice';
import { baseQueryWithAuth } from './base-query';

type Store = ReturnType<typeof makeStore>;

function makeStore() {
  return configureStore({ reducer: { auth: authReducer } });
}

function apiFor(store: Store): BaseQueryApi {
  return {
    signal: new AbortController().signal,
    abort: () => undefined,
    dispatch: store.dispatch,
    getState: store.getState,
    extra: undefined,
    endpoint: 'test',
    type: 'query',
    forced: false,
  };
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function authHeaderOf(call: unknown): string | null {
  const request = (call as [Request]).at(0);
  return request instanceof Request
    ? request.headers.get('authorization')
    : null;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('baseQueryWithAuth', () => {
  it('unwraps the envelope data on success', async () => {
    const store = makeStore();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({
            success: true,
            message: 'ok',
            data: { hello: 'world' },
          }),
        ),
    );

    const result = await baseQueryWithAuth('/branding', apiFor(store), {});

    expect(result.data).toEqual({ hello: 'world' });
  });

  it('attaches the bearer token from state', async () => {
    const store = makeStore();
    store.dispatch(tokensReceived({ access: 'tok', refresh: 'r' }));
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: '', data: {} }),
      );
    vi.stubGlobal('fetch', fetchMock);

    await baseQueryWithAuth('/me', apiFor(store), {});

    expect(authHeaderOf(fetchMock.mock.calls[0])).toBe('Bearer tok');
  });

  it('on 401 refreshes once and retries with the new token', async () => {
    const store = makeStore();
    store.dispatch(tokensReceived({ access: 'old', refresh: 'r1' }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: 'no' }, 401),
      )
      .mockResolvedValueOnce(
        jsonResponse({
          success: true,
          message: '',
          data: { access: 'new', refresh: 'r2' },
        }),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: true, message: '', data: { ok: true } }),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await baseQueryWithAuth('/me', apiFor(store), {});

    expect(result.data).toEqual({ ok: true });
    expect(selectAccessToken(store.getState())).toBe('new');
    expect(authHeaderOf(fetchMock.mock.calls[2])).toBe('Bearer new');
  });

  it('refreshes only once for concurrent 401s (single-flight)', async () => {
    const store = makeStore();
    store.dispatch(tokensReceived({ access: 'old', refresh: 'r1' }));
    let refreshCalls = 0;
    const fetchMock = vi.fn().mockImplementation((request: Request) => {
      if (request.url.includes('/auth/refresh')) {
        refreshCalls += 1;
        return Promise.resolve(
          jsonResponse({
            success: true,
            message: '',
            data: { access: 'new', refresh: 'r2' },
          }),
        );
      }
      if (request.headers.get('authorization') === 'Bearer old') {
        return Promise.resolve(
          jsonResponse({ success: false, message: 'no' }, 401),
        );
      }
      return Promise.resolve(
        jsonResponse({ success: true, message: '', data: { ok: true } }),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const [a, b] = await Promise.all([
      baseQueryWithAuth('/a', apiFor(store), {}),
      baseQueryWithAuth('/b', apiFor(store), {}),
    ]);

    expect(refreshCalls).toBe(1);
    expect(a.data).toEqual({ ok: true });
    expect(b.data).toEqual({ ok: true });
  });

  it('logs out when refresh fails and does not loop', async () => {
    const store = makeStore();
    store.dispatch(tokensReceived({ access: 'old', refresh: 'r1' }));
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: 'no' }, 401),
      )
      .mockResolvedValueOnce(
        jsonResponse({ success: false, message: 'bad refresh' }, 401),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await baseQueryWithAuth('/me', apiFor(store), {});

    expect(result.error?.status).toBe(401);
    expect(selectAccessToken(store.getState())).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('normalizes errors to the envelope message', async () => {
    const store = makeStore();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ success: false, message: 'Validation failed' }, 400),
        ),
    );

    const result = await baseQueryWithAuth('/leads', apiFor(store), {});

    expect(result.error).toEqual({ status: 400, message: 'Validation failed' });
  });
});
