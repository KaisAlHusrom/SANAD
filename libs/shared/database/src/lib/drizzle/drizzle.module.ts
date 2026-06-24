import {
  Global,
  Inject,
  Module,
  type DynamicModule,
  type OnModuleDestroy,
  type Provider,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
// pg is CJS — default-import the module object for the runtime value (`pg.Pool`);
// the type comes via a type-only import (erased, so no ESM named-import issue).
import pg from 'pg';
import type { Pool } from 'pg';
import { DRIZZLE, PG_POOL } from './drizzle.tokens.js';

/** What a service passes to wire its own database (DB-per-service, MS5). */
export interface DrizzleModuleOptions {
  /** The service's Postgres connection string (from its typed env accessor). */
  connectionString: string;
  /** The service's Drizzle schema object (its own tables). */
  schema: Record<string, unknown>;
}

/**
 * The reusable per-service DB wiring (the template every NestJS service uses).
 * Provides the `PG_POOL` (timezone forced to UTC for unambiguous timestamps, N3)
 * and the schema-bound `DRIZZLE` handle, and closes the pool on shutdown (MS8).
 * Global so repositories inject `DRIZZLE` without re-importing.
 */
@Global()
@Module({})
export class DrizzleModule implements OnModuleDestroy {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  static forRoot(options: DrizzleModuleOptions): DynamicModule {
    const poolProvider: Provider = {
      provide: PG_POOL,
      useFactory: () =>
        new pg.Pool({
          connectionString: options.connectionString,
          options: '-c timezone=UTC',
        }),
    };

    const drizzleProvider: Provider = {
      provide: DRIZZLE,
      inject: [PG_POOL],
      useFactory: (pool: Pool) => drizzle(pool, { schema: options.schema }),
    };

    return {
      module: DrizzleModule,
      providers: [poolProvider, drizzleProvider],
      exports: [PG_POOL, DRIZZLE],
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
