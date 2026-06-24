import { pgTable, primaryKey, uuid } from 'drizzle-orm/pg-core';
import { blogPostTable } from './blog-post.table.js';
import { blogTagTable } from './blog-tag.table.js';

/**
 * The blog post ↔ tag many-to-many join (N4). A pure composite-PK link table (no id, no
 * timestamps, no soft-delete) — it carries no entity state, so it is managed by a plain repo
 * (`BlogPostTagRepository`) via delete-then-insert, NOT the BaseRepository entity canon (N1
 * allows specialized aggregates; documented in `content-service.md`). Both FKs cascade.
 */
export const blogPostTagTable = pgTable(
  'blog_post_tag',
  {
    blogPostId: uuid('blog_post_id')
      .notNull()
      .references(() => blogPostTable.id, { onDelete: 'cascade' }),
    blogTagId: uuid('blog_tag_id')
      .notNull()
      .references(() => blogTagTable.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.blogPostId, table.blogTagId] })],
);

export type BlogPostTagRow = typeof blogPostTagTable.$inferSelect;
