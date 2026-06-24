import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';

/**
 * A team member shown on the About page (N4). `slug` is the unique key (a future detail page);
 * `email`/`linkedinUrl`/`githubUrl` are non-translatable; `featured` curates the grid;
 * `avatarMediaId` is a SOFT media reference (nullable, NOT a cross-service FK, MS5).
 * Translatable name/role/bio live in `team_member_translation` (N5). No status.
 */
export const teamMemberTable = pgTable(
  'team_member',
  {
    id: pk(),
    slug: text('slug').notNull().unique(),
    avatarMediaId: uuid('avatar_media_id'),
    email: text('email'),
    linkedinUrl: text('linkedin_url'),
    githubUrl: text('github_url'),
    featured: boolean('featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('team_member_featured_idx').on(table.featured, table.sortOrder),
    index('team_member_avatar_media_idx').on(table.avatarMediaId),
  ],
);

export type TeamMemberRow = typeof teamMemberTable.$inferSelect;
