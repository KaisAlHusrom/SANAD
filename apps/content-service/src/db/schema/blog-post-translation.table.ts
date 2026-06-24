import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { blogPostTable } from './blog-post.table.js';

/**
 * Per-locale blog-post copy (N5). Composite PK `(blog_post_id, locale)`, cascade FK. All
 * translatable columns nullable at the DB so partial per-locale upserts never fail; reads
 * coalesce to '' (F7). `body` is richtext-as-text (mirrors how `block` stores richtext).
 */
export const blogPostTranslationTable = pgTable(
  'blog_post_translation',
  {
    blogPostId: uuid('blog_post_id')
      .notNull()
      .references(() => blogPostTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    title: text('title'),
    excerpt: text('excerpt'),
    body: text('body'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.blogPostId, table.locale] })],
);

export type BlogPostTranslationRow =
  typeof blogPostTranslationTable.$inferSelect;
