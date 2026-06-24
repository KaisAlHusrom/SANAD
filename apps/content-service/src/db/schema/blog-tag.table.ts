import { integer, pgTable, text } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';

/**
 * A blog tag (N4) — a translatable lookup attached to posts via the `blog_post_tag` M2M join.
 * `slug` is the unique key. Translatable `name` lives in `blog_tag_translation` (N5).
 */
export const blogTagTable = pgTable('blog_tag', {
  id: pk(),
  slug: text('slug').notNull().unique(),
  sortOrder: integer('sort_order').notNull().default(0),
  ...timestamps(),
  ...softDelete(),
});

export type BlogTagRow = typeof blogTagTable.$inferSelect;
