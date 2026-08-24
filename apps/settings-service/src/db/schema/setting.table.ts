import { index, jsonb, pgTable, text } from 'drizzle-orm/pg-core';
import { jsonbScalar, pk, softDelete, timestamps } from '@sanad/database';
import {
  settingRequirementEnum,
  settingScopeEnum,
  settingTypeEnum,
} from './enums.js';
import type { SettingScalar } from './value.types.js';

/**
 * The setting **catalog** (descriptor) — one row per configurable key (N4). Holds the
 * metadata the resolver + admin editor need: type, requirement, select `options`, the
 * `group` to resolve together, and the highest `scope` this key may be set at. The
 * authoritative coded default lives in code (`SETTINGS_DEFAULTS`, U9); `defaultValue`
 * here is a catalog convenience the CMS may show. Seeded idempotently at boot.
 */
export const settingTable = pgTable(
  'setting',
  {
    id: pk(),
    key: text('key').notNull().unique(),
    group: text('group').notNull(),
    type: settingTypeEnum('type').notNull(),
    requirement: settingRequirementEnum('requirement')
      .notNull()
      .default('optional'),
    scope: settingScopeEnum('scope').notNull().default('global'),
    options: jsonb('options').$type<string[]>(),
    // A bare scalar, so it carries the same double-parse trap as `setting_value.value` —
    // see `jsonbScalar`. `options` above is an ARRAY, which pg hands over already parsed as
    // an array, so drizzle never re-parses it and stock `jsonb()` is correct there.
    defaultValue: jsonbScalar('default_value').$type<SettingScalar>(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [index('setting_group_idx').on(table.group)],
);

export type SettingRow = typeof settingTable.$inferSelect;
