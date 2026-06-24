import { index, integer, pgTable, text } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { pageStatusEnum } from './enums.js';

/**
 * A website page (N4) — the root of the Page → Section → Block tree. `slug` is the unique
 * route key (`landing`, `about`, …); the website reads the published tree by slug (WEB2).
 * Translatable title + SEO meta live in `page_translation` (N5), never on this base row.
 */
export const pageTable = pgTable(
  'page',
  {
    id: pk(),
    slug: text('slug').notNull().unique(),
    status: pageStatusEnum('status').notNull().default('published'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [index('page_status_idx').on(table.status)],
);

export type PageRow = typeof pageTable.$inferSelect;
