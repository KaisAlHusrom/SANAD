import {
  Global,
  Inject,
  Module,
  type DynamicModule,
  type OnModuleDestroy,
  type Provider,
} from '@nestjs/common';
import { drizzle } from 'drizzle-orm/node-postgres';
import { DateTimeService } from '../date-time.js';
// pg is CJS — default-import the module object for the runtime value (`pg.Pool`);
// the type comes via a type-only import (erased, so no ESM named-import issue).
import pg from 'pg';
import type { Pool } from 'pg';
import { DRIZZLE, PG_POOL } from './drizzle.tokens.js';
import { DrizzleTransactionRunner } from './transaction/drizzle-transaction-runner.js';
import { TransactionRunner } from './transaction/transaction-runner.js';

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

    // The Unit-of-Work seam (N14): application services inject `TransactionRunner` for
    // atomic multi-writes (business row + Outbox + idempotency claim in one tx) and never
    // the `DRIZZLE` handle. Provided here so every service that wires `DrizzleModule` gets
    // it with zero extra wiring.
    const transactionRunnerProvider: Provider = {
      provide: TransactionRunner,
      useClass: DrizzleTransactionRunner,
    };

    // The shared clock (N3). Provided by the @Global infrastructure root rather than by each
    // service's own AppModule, because an AppModule-local provider is invisible to the modules
    // that AppModule IMPORTS — which is exactly how `AuditModule` (P8.8) could not resolve it and
    // crash-looped settings-service at boot while all 38 of its unit tests stayed green.
    // Every repository this module serves needs the clock anyway; the six services keep their own
    // local provider harmlessly (it wins inside AppModule, and both instances are stateless).
    const clockProvider: Provider = {
      provide: DateTimeService,
      useFactory: () => new DateTimeService(),
    };

    return {
      module: DrizzleModule,
      providers: [
        poolProvider,
        drizzleProvider,
        transactionRunnerProvider,
        clockProvider,
      ],
      exports: [PG_POOL, DRIZZLE, TransactionRunner, DateTimeService],
    };
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
