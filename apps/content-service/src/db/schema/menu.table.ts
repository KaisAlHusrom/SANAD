import { index, integer, pgTable } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { menuKeyEnum } from './enums.js';

/**
 * A navigation menu (N4) — a keyed container the website renders (`primary` header / `footer`).
 * `key` is the unique machine key (NOT a user slug). The menu itself is NOT translatable (its
 * items carry the labels — N5 on `menu_item`), so this is a plain `BaseRepository` table.
 */
export const menuTable = pgTable(
  'menu',
  {
    id: pk(),
    key: menuKeyEnum('key').notNull().unique(),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [index('menu_key_idx').on(table.key)],
);

export type MenuRow = typeof menuTable.$inferSelect;
