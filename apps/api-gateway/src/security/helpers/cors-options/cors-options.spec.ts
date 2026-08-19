import { describe, expect, it } from 'vitest';
import { corsOptions } from './cors-options.js';

describe('corsOptions', () => {
  /**
   * Nothing in the product needs CORS: the admin calls a RELATIVE `/api` through nginx and the
   * website fetches server-side. So an empty allow-list must emit no `Access-Control-Allow-Origin`
   * header at all, rather than a permissive default nobody asked for.
   */
  it('allows no cross-origin caller when the list is empty', () => {
    expect(corsOptions({ CORS_ALLOWED_ORIGINS: [] }).origin).toBe(false);
  });

  it('admits a listed origin and refuses an unlisted one', () => {
    const { origin } = corsOptions({
      CORS_ALLOWED_ORIGINS: ['https://admin.x.com'],
    });
    expect(Array.isArray(origin) ? origin : []).toEqual([
      'https://admin.x.com',
    ]);
  });

  // The admin authenticates with a Bearer header, never a cookie — so credentialed CORS would
  // grant an origin more than it needs.
  it('never enables credentialed requests', () => {
    expect(
      corsOptions({ CORS_ALLOWED_ORIGINS: ['https://admin.x.com'] })
        .credentials,
    ).toBe(false);
  });

  it('allows the headers this API actually reads', () => {
    const { allowedHeaders } = corsOptions({
      CORS_ALLOWED_ORIGINS: ['https://admin.x.com'],
    });
    expect(allowedHeaders).toEqual(
      expect.arrayContaining([
        'authorization',
        'content-type',
        'x-sanad-locale',
        'x-request-id',
      ]),
    );
  });

  // Without exposing them a cross-origin caller cannot read its own rate-limit standing or
  // quote a request id in a bug report — the headers would be set and invisible.
  it('exposes the request id and the rate-limit headers to the caller', () => {
    const { exposedHeaders } = corsOptions({
      CORS_ALLOWED_ORIGINS: ['https://admin.x.com'],
    });
    expect(exposedHeaders).toEqual(
      expect.arrayContaining([
        'x-request-id',
        'x-ratelimit-limit',
        'x-ratelimit-remaining',
        'x-ratelimit-reset',
        'retry-after',
      ]),
    );
  });

  it('permits only the verbs the API serves, and caches the preflight', () => {
    const options = corsOptions({
      CORS_ALLOWED_ORIGINS: ['https://admin.x.com'],
    });
    expect(options.methods).toEqual([
      'GET',
      'POST',
      'PUT',
      'PATCH',
      'DELETE',
      'OPTIONS',
    ]);
    expect(options.maxAge).toBeGreaterThan(0);
  });
});
