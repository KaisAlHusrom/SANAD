import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { serviceTable } from './service.table.js';

/**
 * Per-locale service copy (N5). Composite PK `(service_id, locale)`, cascade FK. `title` is
 * conceptually required (enforced at the contract edge); kept nullable at the DB so partial
 * per-locale upserts never fail. Reads coalesce to '' (F7).
 */
export const serviceTranslationTable = pgTable(
  'service_translation',
  {
    serviceId: uuid('service_id')
      .notNull()
      .references(() => serviceTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    title: text('title'),
    summary: text('summary'),
    detailBody: text('detail_body'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.serviceId, table.locale] })],
);

export type ServiceTranslationRow = typeof serviceTranslationTable.$inferSelect;
