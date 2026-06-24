import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { testimonialTable } from './testimonial.table.js';

/**
 * Per-locale testimonial copy (N5). Composite PK `(testimonial_id, locale)`, cascade FK.
 * `quote` is conceptually required (enforced at the contract edge); kept nullable at the DB so
 * partial per-locale upserts never fail. Reads coalesce to '' (F7).
 */
export const testimonialTranslationTable = pgTable(
  'testimonial_translation',
  {
    testimonialId: uuid('testimonial_id')
      .notNull()
      .references(() => testimonialTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    quote: text('quote'),
    authorRole: text('author_role'),
    companyDescriptor: text('company_descriptor'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.testimonialId, table.locale] })],
);

export type TestimonialTranslationRow =
  typeof testimonialTranslationTable.$inferSelect;
