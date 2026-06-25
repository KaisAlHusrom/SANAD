import type { NotificationsDb } from './schema/index.js';

/**
 * A Drizzle handle OR an open transaction — the query-builder surface the repos use.
 * Lets a repo write within the caller's transaction (MS6: notification rows + the
 * idempotency claim in one tx). Both the pooled `NotificationsDb` and a `db.transaction`
 * tx satisfy this. The application service injects a `TransactionRunner` (N14) and passes
 * the yielded tx here — never the raw `DRIZZLE` handle.
 */
export type DbExecutor = Pick<
  NotificationsDb,
  'insert' | 'select' | 'update' | 'delete'
>;
