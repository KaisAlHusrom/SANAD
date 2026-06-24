import {
  Global,
  Inject,
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
      useFactory: () => new Redis(options.url, { maxRetriesPerRequest: null }),
    };

    return {
      module: CacheModule,
      providers: [clientProvider, RedisCache],
      exports: [RedisCache, REDIS_CLIENT],
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.client.quit();
  }
}
