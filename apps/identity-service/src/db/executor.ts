import type { IdentityDb } from './schema/index.js';

/**
 * A Drizzle handle OR an open transaction — the query-builder surface the repos use. Lets a
 * repo write within the caller's transaction (N14: the user insert + its role assignments in
 * one tx). Both the pooled `IdentityDb` and a `db.transaction` tx satisfy this.
 */
export type DbExecutor = Pick<
  IdentityDb,
  'insert' | 'select' | 'update' | 'delete'
>;
