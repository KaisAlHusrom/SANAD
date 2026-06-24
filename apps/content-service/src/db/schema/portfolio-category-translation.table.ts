import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { portfolioCategoryTable } from './portfolio-category.table.js';

/**
 * Per-locale portfolio-category copy (N5). Composite PK `(portfolio_category_id, locale)`,
 * cascade FK. `name` nullable at the DB so partial per-locale upserts never fail; reads coalesce
 * to '' (F7).
 */
export const portfolioCategoryTranslationTable = pgTable(
  'portfolio_category_translation',
  {
    portfolioCategoryId: uuid('portfolio_category_id')
      .notNull()
      .references(() => portfolioCategoryTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name'),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.portfolioCategoryId, table.locale] }),
  ],
);

export type PortfolioCategoryTranslationRow =
  typeof portfolioCategoryTranslationTable.$inferSelect;
