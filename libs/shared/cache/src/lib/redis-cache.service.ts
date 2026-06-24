import { Inject, Injectable } from '@nestjs/common';
import { REDIS_CLIENT } from './cache.tokens.js';

/**
 * The minimal Redis surface `RedisCache` depends on — an ioredis client satisfies it
 * structurally. Declaring our own interface (rather than importing ioredis types)
 * keeps unit tests free of a live Redis: a tiny in-memory fake implements this.
 */
export interface RedisClient {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<unknown>;
  setex(key: string, seconds: number, value: string): Promise<unknown>;
  del(key: string): Promise<unknown>;
  incr(key: string): Promise<number>;
}

/**
 * The shared cache primitive (cross-cutting infrastructure — chassis, not domain).
 * JSON-(de)serializes in ONE place so every consumer stores/reads typed values the
 * same way. Used by settings-service now (branding cache) and content-service (P5).
 * Pair with a version-key (`incr`) for invalidation: bump the version, write under the
 * new versioned key, let old entries expire — no cross-request delete races.
 */
@Injectable()
export class RedisCache {
  constructor(@Inject(REDIS_CLIENT) private readonly client: RedisClient) {}

  /** Read + parse a JSON value; `null` when the key is absent. */
  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw === null ? null : (JSON.parse(raw) as T);
  }

  /** Serialize + store a value; a positive `ttlSeconds` sets an expiry. */
  async set(key: string, value: unknown, ttlSeconds?: number): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds !== undefined && ttlSeconds > 0) {
      await this.client.setex(key, ttlSeconds, raw);
    } else {
      await this.client.set(key, raw);
    }
  }

  /** Delete a key. */
  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  /** Atomically increment an integer key (missing → 1) and return the new value. */
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }
}
