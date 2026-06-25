import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { outboxTable } from '@sanad/messaging';
import { settingTable } from './setting.table.js';
import { settingValueTable } from './setting-value.table.js';
import { settingTranslationTable } from './setting-translation.table.js';
import { integrationSecretTable } from './integration-secret.table.js';

/** The settings service's full Drizzle schema (its own DB, MS5) — incl. the Outbox. */
export const schema = {
  settingTable,
  settingValueTable,
  settingTranslationTable,
  integrationSecretTable,
  outboxTable,
};

/** The typed Drizzle handle bound to this service's schema (injected via `DRIZZLE`). */
export type SettingsDb = NodePgDatabase<typeof schema>;
