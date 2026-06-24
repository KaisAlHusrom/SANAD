import { index, integer, pgTable } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { faqCategoryEnum } from './enums.js';

/**
 * An FAQ entry (N4). `category` is an optional grouping (general/pricing/process/support);
 * `sort_order` orders the list. No slug — FAQs are listed, not addressed individually.
 * Translatable question/answer live in `faq_translation` (N5). No status — soft-delete hides it.
 */
export const faqTable = pgTable(
  'faq',
  {
    id: pk(),
    category: faqCategoryEnum('category'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [index('faq_category_idx').on(table.category, table.sortOrder)],
);

export type FaqRow = typeof faqTable.$inferSelect;
