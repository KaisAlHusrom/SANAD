import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchEnvelope } from './fetch-envelope';

function mockFetch(impl: typeof fetch) {
  vi.stubGlobal('fetch', vi.fn(impl));
}

function jsonResponse(body: unknown, init?: { ok?: boolean; status?: number }) {
  return {
    ok: init?.ok ?? true,
    status: init?.status ?? 200,
    json: async () => body,
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('fetchEnvelope', () => {
  it('prefixes the gateway base URL and unwraps the envelope data (F1)', async () => {
    mockFetch(async () =>
      jsonResponse({
        success: true,
        message: 'ok',
        data: { hello: 'world' },
        path: '/api/x',
        timestamp: 't',
      }),
    );
    const data = await fetchEnvelope<{ hello: string }>('/content/x');
    expect(data).toEqual({ hello: 'world' });
    expect(fetch).toHaveBeenCalledWith(
      'http://nginx/api/content/x',
      expect.objectContaining({ method: 'GET' }),
    );
  });

  it('throws the envelope message when success is false', async () => {
    mockFetch(async () =>
      jsonResponse({ success: false, message: 'nope', data: null }),
    );
    await expect(fetchEnvelope('/content/x')).rejects.toThrow(/nope/);
  });

  it('throws on a non-2xx response (status in the error)', async () => {
    mockFetch(async () => jsonResponse({}, { ok: false, status: 503 }));
    await expect(fetchEnvelope('/content/x')).rejects.toThrow(/503/);
  });

  it('sends a JSON body + content-type for POST', async () => {
    mockFetch(async () =>
      jsonResponse({ success: true, message: 'ok', data: { id: 'abc' } }),
    );
    const data = await fetchEnvelope<{ id: string }>('/leads', {
      method: 'POST',
      body: { name: 'Sara' },
      cache: 'no-store',
    });
    expect(data).toEqual({ id: 'abc' });
    expect(fetch).toHaveBeenCalledWith(
      'http://nginx/api/leads',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ name: 'Sara' }),
        cache: 'no-store',
        headers: expect.objectContaining({
          'content-type': 'application/json',
        }),
      }),
    );
  });

  it('forwards Next revalidate + cache tags', async () => {
    mockFetch(async () =>
      jsonResponse({ success: true, message: 'ok', data: 1 }),
    );
    await fetchEnvelope('/branding', { revalidate: 60, tags: ['branding'] });
    expect(fetch).toHaveBeenCalledWith(
      'http://nginx/api/branding',
      expect.objectContaining({
        next: { revalidate: 60, tags: ['branding'] },
      }),
    );
  });

  it('aborts and throws a timeout error when the request stalls', async () => {
    mockFetch(
      (_, init) =>
        new Promise((_resolve, reject) => {
          const signal = (init as RequestInit).signal;
          signal?.addEventListener('abort', () =>
            reject(new DOMException('Aborted', 'AbortError')),
          );
        }),
    );
    await expect(
      fetchEnvelope('/content/x', { timeoutMs: 10 }),
    ).rejects.toThrow(/timed out/i);
  });
});
