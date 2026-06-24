import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { portfolioProjectTable } from './portfolio-project.table.js';

/**
 * Per-locale portfolio-project copy (N5). Composite PK `(portfolio_project_id, locale)`, cascade
 * FK. All translatable columns nullable at the DB so partial per-locale upserts never fail;
 * reads coalesce to '' (F7).
 */
export const portfolioProjectTranslationTable = pgTable(
  'portfolio_project_translation',
  {
    portfolioProjectId: uuid('portfolio_project_id')
      .notNull()
      .references(() => portfolioProjectTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    title: text('title'),
    summary: text('summary'),
    challenge: text('challenge'),
    solution: text('solution'),
    result: text('result'),
    ...timestamps(),
  },
  (table) => [
    primaryKey({ columns: [table.portfolioProjectId, table.locale] }),
  ],
);

export type PortfolioProjectTranslationRow =
  typeof portfolioProjectTranslationTable.$inferSelect;
