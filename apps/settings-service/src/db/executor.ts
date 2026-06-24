import type { SettingsDb } from './schema/index.js';

/**
 * A Drizzle handle OR an open transaction — the query-builder surface the repos use.
 * Lets a repo write within the caller's transaction (MS3: business row + outbox row in
 * one tx). Both the pooled `SettingsDb` and a `db.transaction` tx satisfy this.
 */
export type DbExecutor = Pick<
  SettingsDb,
  'insert' | 'select' | 'update' | 'delete'
>;
