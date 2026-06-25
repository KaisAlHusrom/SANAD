import type { RepoDb } from '../repository/repository.types.js';

/**
 * Unit-of-Work port (N14): the only db-touching seam an application service may inject.
 * `run` opens a single transaction and yields a `RepoDb`-shaped executor (`tx`) to the
 * callback; the service threads that `tx` into its repositories so the business write,
 * the Outbox enqueue (MS3), and the idempotency claim (MS6) all commit — or roll back —
 * together. Application services depend on this abstract class, NEVER the `DRIZZLE`
 * handle (ESLint-enforced), keeping the raw db inside repositories + infrastructure.
 *
 * The abstract class doubles as the DI token (the N11 seam pattern); `DrizzleModule`
 * binds it to {@link DrizzleTransactionRunner}.
 */
export abstract class TransactionRunner {
  /** Run `work` inside one transaction; its return value is the transaction result. */
  abstract run<T>(work: (tx: RepoDb) => Promise<T>): Promise<T>;
}
