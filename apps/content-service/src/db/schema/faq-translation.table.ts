import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { faqTable } from './faq.table.js';

/**
 * Per-locale FAQ copy (N5). Composite PK `(faq_id, locale)`, cascade FK. `question`/`answer`
 * are conceptually required (enforced at the contract edge); kept nullable at the DB so partial
 * per-locale upserts never fail. Reads coalesce to '' (F7).
 */
export const faqTranslationTable = pgTable(
  'faq_translation',
  {
    faqId: uuid('faq_id')
      .notNull()
      .references(() => faqTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    question: text('question'),
    answer: text('answer'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.faqId, table.locale] })],
);

export type FaqTranslationRow = typeof faqTranslationTable.$inferSelect;
