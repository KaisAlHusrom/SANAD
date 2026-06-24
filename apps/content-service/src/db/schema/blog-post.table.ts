import {
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { blogPostStatusEnum } from './enums.js';
import { blogCategoryTable } from './blog-category.table.js';
import { teamMemberTable } from './team-member.table.js';

/**
 * A blog post (N4). `slug` is the unique route key; `category_id` (FK → blog_category, `set
 * null`) and `author_team_member_id` (FK → team_member, `set null`) are same-DB soft links;
 * `status` gates public visibility (drafts hidden, WEB2); `published_at` records the first
 * publish; `read_minutes` is an optional reading-time estimate; `cover_media_id` is a SOFT media
 * reference (MS5). Tags attach via the `blog_post_tag` M2M join. Translatable title/excerpt/body
 * live in `blog_post_translation` (N5).
 */
export const blogPostTable = pgTable(
  'blog_post',
  {
    id: pk(),
    slug: text('slug').notNull().unique(),
    categoryId: uuid('category_id').references(() => blogCategoryTable.id, {
      onDelete: 'set null',
    }),
    authorTeamMemberId: uuid('author_team_member_id').references(
      () => teamMemberTable.id,
      { onDelete: 'set null' },
    ),
    coverMediaId: uuid('cover_media_id'),
    status: blogPostStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    readMinutes: integer('read_minutes'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('blog_post_status_idx').on(table.status, table.publishedAt),
    index('blog_post_category_idx').on(table.categoryId),
    index('blog_post_author_idx').on(table.authorTeamMemberId),
    index('blog_post_cover_media_idx').on(table.coverMediaId),
  ],
);

export type BlogPostRow = typeof blogPostTable.$inferSelect;
