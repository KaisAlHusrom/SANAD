import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { menuItemTable } from './menu-item.table.js';

/**
 * Per-locale menu-item copy (N5). Composite PK `(menu_item_id, locale)`, cascade FK. `label` is
 * conceptually required (enforced at the contract edge); kept nullable at the DB so partial
 * per-locale upserts never fail. Reads coalesce to '' (F7).
 */
export const menuItemTranslationTable = pgTable(
  'menu_item_translation',
  {
    menuItemId: uuid('menu_item_id')
      .notNull()
      .references(() => menuItemTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    label: text('label'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.menuItemId, table.locale] })],
);

export type MenuItemTranslationRow =
  typeof menuItemTranslationTable.$inferSelect;
