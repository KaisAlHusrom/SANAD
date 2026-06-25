import { Inject, Injectable } from '@nestjs/common';
import { DRIZZLE } from '../drizzle.tokens.js';
import type { RepoDb } from '../repository/repository.types.js';
import { TransactionRunner } from './transaction-runner.js';

/**
 * The minimal surface the runner needs: a `transaction` that yields a {@link RepoDb}-shaped
 * tx. Declared as a METHOD (not an arrow property) so its callback param is checked
 * bivariantly — any per-service schema-bound `NodePgDatabase<typeof schema>` (whose real tx
 * is a superset of `RepoDb`) satisfies it, without coupling to a concrete schema type.
 */
interface Transactable {
  transaction<T>(work: (tx: RepoDb) => Promise<T>): Promise<T>;
}

/**
 * Drizzle-backed {@link TransactionRunner} (N14). Wraps `db.transaction`, yielding the
 * open transaction as a `RepoDb` to the work callback. This class is INFRASTRUCTURE, so
 * it MAY hold the `DRIZZLE` handle (the N14 ban targets application services). Bound to
 * the abstract `TransactionRunner` token by `DrizzleModule.forRoot`.
 */
@Injectable()
export class DrizzleTransactionRunner extends TransactionRunner {
  constructor(@Inject(DRIZZLE) private readonly db: Transactable) {
    super();
  }

  run<T>(work: (tx: RepoDb) => Promise<T>): Promise<T> {
    return this.db.transaction(work);
  }
}
