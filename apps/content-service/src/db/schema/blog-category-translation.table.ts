import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { blogCategoryTable } from './blog-category.table.js';

/**
 * Per-locale blog-category copy (N5). Composite PK `(blog_category_id, locale)`, cascade FK.
 * `name`/`description` nullable at the DB so partial per-locale upserts never fail; reads
 * coalesce to '' (F7).
 */
export const blogCategoryTranslationTable = pgTable(
  'blog_category_translation',
  {
    blogCategoryId: uuid('blog_category_id')
      .notNull()
      .references(() => blogCategoryTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name'),
    description: text('description'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.blogCategoryId, table.locale] })],
);

export type BlogCategoryTranslationRow =
  typeof blogCategoryTranslationTable.$inferSelect;
