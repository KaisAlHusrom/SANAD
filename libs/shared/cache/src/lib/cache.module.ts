import {
  Global,
  Inject,
  Logger,
  Module,
  type DynamicModule,
  type OnModuleDestroy,
  type Provider,
} from '@nestjs/common';
// ioredis ships a compiled-TS CJS module that sets `__esModule` and exposes a static
// `exports.Redis` (its own recommended import form), so the ESM loader resolves this
// named import at runtime (N12 — still boot-verified). `Redis` is both value + type.
import { Redis } from 'ioredis';
import { REDIS_CLIENT } from './cache.tokens.js';
import { RateLimitCounter } from './rate-limit-counter/index.js';
import { RedisCache } from './redis-cache.service.js';

/** What a service passes to wire the shared cache (its own Redis URL, from env). */
export interface CacheModuleOptions {
  /** The Redis connection string (e.g. `redis://redis:6379`). */
  url: string;
}

/**
 * The reusable cache wiring (chassis infrastructure, U2/U17). Provides one ioredis
 * client + the `RedisCache` primitive, and quits the connection on shutdown (MS8).
 * Global so any service injects `RedisCache` without re-importing.
 */
@Global()
@Module({})
export class CacheModule implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly client: Redis) {}

  static forRoot(options: CacheModuleOptions): DynamicModule {
    const clientProvider: Provider = {
      provide: REDIS_CLIENT,
      // maxRetriesPerRequest: null keeps commands queued across reconnects rather
      // than failing fast — appropriate for a cache that tolerates brief blips.
      // NOTE for an edge guard (P8.10.A): queued-forever is exactly wrong on a per-request
      // path, so `RateLimitGuard` races every call against its own deadline.
      useFactory: () => {
        const client = new Redis(options.url, { maxRetriesPerRequest: null });
        // ioredis emits 'error' on every reconnect attempt. Without a listener Node logs
        // `[ioredis] Unhandled error event` per attempt — a real outage produced 7 per
        // process. A listener turns that into one structured warn and keeps the process
        // alive, which is what the callers' own fallbacks already assume.
        client.on('error', (error: Error) => {
          new Logger(CacheModule.name).warn(`redis: ${error.message}`);
        });
        return client;
      },
    };

    return {
      module: CacheModule,
      providers: [clientProvider, RedisCache, RateLimitCounter],
      exports: [RedisCache, RateLimitCounter, REDIS_CLIENT],
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
