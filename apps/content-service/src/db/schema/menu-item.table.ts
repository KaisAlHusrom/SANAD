import {
  index,
  integer,
  pgTable,
  text,
  uuid,
  type AnyPgColumn,
} from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { menuTable } from './menu.table.js';

/**
 * A navigation menu item (N4). Belongs to a `menu_id` (cascade); `parent_id` self-references
 * another item for one level of nesting (footer columns / dropdowns, cascade). `url`/`icon` are
 * non-translatable; the translatable `label` lives in `menu_item_translation` (N5).
 */
export const menuItemTable = pgTable(
  'menu_item',
  {
    id: pk(),
    menuId: uuid('menu_id')
      .notNull()
      .references(() => menuTable.id, { onDelete: 'cascade' }),
    parentId: uuid('parent_id').references(
      (): AnyPgColumn => menuItemTable.id,
      {
        onDelete: 'cascade',
      },
    ),
    url: text('url').notNull(),
    icon: text('icon'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('menu_item_menu_idx').on(
      table.menuId,
      table.parentId,
      table.sortOrder,
    ),
  ],
);

export type MenuItemRow = typeof menuItemTable.$inferSelect;
