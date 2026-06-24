import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { blogTagTable } from './blog-tag.table.js';

/**
 * Per-locale blog-tag copy (N5). Composite PK `(blog_tag_id, locale)`, cascade FK. `name`
 * nullable at the DB so partial per-locale upserts never fail; reads coalesce to '' (F7).
 */
export const blogTagTranslationTable = pgTable(
  'blog_tag_translation',
  {
    blogTagId: uuid('blog_tag_id')
      .notNull()
      .references(() => blogTagTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    name: text('name'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.blogTagId, table.locale] })],
);

export type BlogTagTranslationRow = typeof blogTagTranslationTable.$inferSelect;
