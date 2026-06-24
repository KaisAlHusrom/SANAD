import { describe, expect, it } from 'vitest';
import { RedisCache, type RedisClient } from './redis-cache.service.js';

/** An in-memory RedisClient fake — records the last setex TTL for assertions. */
function fakeClient() {
  const store = new Map<string, string>();
  let lastTtl: number | null = null;
  const client: RedisClient = {
    get: async (key) => store.get(key) ?? null,
    set: async (key, value) => {
      lastTtl = null;
      store.set(key, value);
      return 'OK';
    },
    setex: async (key, seconds, value) => {
      lastTtl = seconds;
      store.set(key, value);
      return 'OK';
    },
    del: async (key) => (store.delete(key) ? 1 : 0),
    incr: async (key) => {
      const next = Number(store.get(key) ?? '0') + 1;
      store.set(key, String(next));
      return next;
    },
  };
  return { client, store, ttl: () => lastTtl };
}

describe('RedisCache', () => {
  it('round-trips a typed JSON value', async () => {
    const { client } = fakeClient();
    const cache = new RedisCache(client);
    await cache.set('k', { a: 1, b: ['x'] });
    expect(await cache.get<{ a: number; b: string[] }>('k')).toEqual({
      a: 1,
      b: ['x'],
    });
  });

  it('returns null for a missing key', async () => {
    const { client } = fakeClient();
    const cache = new RedisCache(client);
    expect(await cache.get('missing')).toBeNull();
  });

  it('sets a TTL via setex when ttlSeconds is positive', async () => {
    const { client, ttl } = fakeClient();
    const cache = new RedisCache(client);
    await cache.set('k', 'v', 3600);
    expect(ttl()).toBe(3600);
  });

  it('uses set (no expiry) when ttlSeconds is omitted or zero', async () => {
    const { client, ttl } = fakeClient();
    const cache = new RedisCache(client);
    await cache.set('k', 'v');
    expect(ttl()).toBeNull();
    await cache.set('k2', 'v', 0);
    expect(ttl()).toBeNull();
  });

  it('deletes a key', async () => {
    const { client } = fakeClient();
    const cache = new RedisCache(client);
    await cache.set('k', 'v');
    await cache.del('k');
    expect(await cache.get('k')).toBeNull();
  });

  it('incr starts at 1 and counts up (version-key invalidation)', async () => {
    const { client } = fakeClient();
    const cache = new RedisCache(client);
    expect(await cache.incr('settings:branding:version')).toBe(1);
    expect(await cache.incr('settings:branding:version')).toBe(2);
  });
});
