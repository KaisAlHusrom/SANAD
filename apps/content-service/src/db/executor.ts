import type { ContentDb } from './schema/index.js';

/**
 * A Drizzle handle OR an open transaction — the query-builder surface the repos use.
 * Lets a repo write within the caller's transaction (MS3: business row + outbox row in
 * one tx). Both the pooled `ContentDb` and a `db.transaction` tx satisfy this.
 */
export type DbExecutor = Pick<
  ContentDb,
  'insert' | 'select' | 'update' | 'delete'
>;
