import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { sectionTable } from './section.table.js';

/**
 * Per-locale section copy (N5). Composite PK `(section_id, locale)`, cascade FK. All columns
 * nullable (a section header is optional copy); reads coalesce to '' (F7).
 */
export const sectionTranslationTable = pgTable(
  'section_translation',
  {
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sectionTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    eyebrow: text('eyebrow'),
    title: text('title'),
    subtitle: text('subtitle'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.sectionId, table.locale] })],
);

export type SectionTranslationRow = typeof sectionTranslationTable.$inferSelect;
