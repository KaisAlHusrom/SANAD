import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';

/**
 * A portfolio category (N4) — a translatable lookup the work grid filters by. `slug` is the
 * unique key; `sort_order` orders the list. Translatable `name` lives in
 * `portfolio_category_translation` (N5).
 */
export const portfolioCategoryTable = pgTable('portfolio_category', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps(),
  ...softDelete(),
});

export type PortfolioCategoryRow = typeof portfolioCategoryTable.$inferSelect;
