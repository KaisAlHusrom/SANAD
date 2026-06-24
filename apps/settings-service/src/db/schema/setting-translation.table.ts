import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { settingValueTable } from './setting-value.table.js';

/**
 * Per-locale text for `localized_text` setting values (N5 — translatable columns get a
 * dedicated table, never multiple languages in the base row). Keyed by the setting
 * value + locale. `locale` is validated at the contract edge (`localeSchema`); the DB
 * keeps it a plain text composite-PK column (mirrors the role_permission pattern).
 */
export const settingTranslationTable = pgTable(
  'setting_translation',
  {
    settingValueId: uuid('setting_value_id')
      .notNull()
      .references(() => settingValueTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    value: text('value').notNull(),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.settingValueId, table.locale] })],
);

export type SettingTranslationRow = typeof settingTranslationTable.$inferSelect;
