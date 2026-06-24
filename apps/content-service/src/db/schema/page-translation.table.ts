import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { pageTable } from './page.table.js';

/**
 * Per-locale page title + SEO meta (N5 — translatable columns get a dedicated table).
 * Composite PK `(page_id, locale)`; cascades when the page is hard-deleted. Columns are
 * nullable so a partial per-locale upsert never fails; reads coalesce to '' (F7).
 */
export const pageTranslationTable = pgTable(
  'page_translation',
  {
    pageId: uuid('page_id')
      .notNull()
      .references(() => pageTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    title: text('title'),
    metaTitle: text('meta_title'),
    metaDescription: text('meta_description'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.pageId, table.locale] })],
);

export type PageTranslationRow = typeof pageTranslationTable.$inferSelect;
