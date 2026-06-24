import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { portfolioStatusEnum } from './enums.js';
import { portfolioCategoryTable } from './portfolio-category.table.js';

/**
 * A portfolio project / case study (N4). `slug` is the unique detail-page key; `category_id` is
 * a same-DB FK to a portfolio category (`set null` on delete — a removed category must not
 * delete projects). `client_name`/`project_url` are non-translatable; `status` gates public
 * visibility (drafts hidden, WEB2); `published_at` records the first publish; `featured` curates
 * the landing work grid; `cover_media_id` is a SOFT media reference (MS5). Translatable
 * title/summary/challenge/solution/result live in `portfolio_project_translation` (N5).
 */
export const portfolioProjectTable = pgTable(
  'portfolio_project',
  {
    id: pk(),
    slug: text('slug').notNull().unique(),
    categoryId: uuid('category_id').references(
      () => portfolioCategoryTable.id,
      {
        onDelete: 'set null',
      },
    ),
    coverMediaId: uuid('cover_media_id'),
    clientName: text('client_name'),
    projectUrl: text('project_url'),
    status: portfolioStatusEnum('status').notNull().default('draft'),
    publishedAt: timestamp('published_at', { withTimezone: true }),
    featured: boolean('featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('portfolio_project_status_idx').on(table.status, table.sortOrder),
    index('portfolio_project_category_idx').on(table.categoryId),
    index('portfolio_project_featured_idx').on(table.featured, table.sortOrder),
    index('portfolio_project_cover_media_idx').on(table.coverMediaId),
  ],
);

export type PortfolioProjectRow = typeof portfolioProjectTable.$inferSelect;
