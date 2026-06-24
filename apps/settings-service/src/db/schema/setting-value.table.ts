import { sql } from 'drizzle-orm';
import { jsonb, pgTable, text, uniqueIndex, uuid } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { settingTable } from './setting.table.js';
import { settingScopeEnum } from './enums.js';
import type { SettingScalar } from './value.types.js';

/**
 * The actual **set** values, scope-keyed (N4). `scope='global'` (scopeId NULL) is the
 * single platform value; `scope='client'` + `scopeId` is a per-client override (wired,
 * dormant in MVP). `value` is NULL for `localized_text` settings (their text lives in
 * `setting_translation`). Two partial unique indexes enforce one value per scope with
 * clean NULL semantics (Postgres treats NULLs as distinct).
 */
export const settingValueTable = pgTable(
  'setting_value',
  {
    id: pk(),
    settingId: uuid('setting_id')
      .notNull()
      .references(() => settingTable.id, { onDelete: 'cascade' }),
    scope: settingScopeEnum('scope').notNull().default('global'),
    scopeId: text('scope_id'),
    value: jsonb('value').$type<SettingScalar>(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    // Exactly one global value per setting.
    uniqueIndex('uq_setting_value_global')
      .on(table.settingId)
      .where(sql`${table.scope} = 'global'`),
    // Exactly one value per (setting, scope, scopeId) for non-global scopes.
    uniqueIndex('uq_setting_value_scoped')
      .on(table.settingId, table.scope, table.scopeId)
      .where(sql`${table.scope} <> 'global'`),
  ],
);

export type SettingValueRow = typeof settingValueTable.$inferSelect;
