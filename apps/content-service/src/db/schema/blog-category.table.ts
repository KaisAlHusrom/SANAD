import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';

/**
 * A blog category (N4) — a translatable lookup the blog index filters by. `slug` is the unique
 * key; `sort_order` orders the list. Translatable `name`/`description` live in
 * `blog_category_translation` (N5).
 */
export const blogCategoryTable = pgTable('blog_category', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps(),
  ...softDelete(),
});

export type BlogCategoryRow = typeof blogCategoryTable.$inferSelect;
