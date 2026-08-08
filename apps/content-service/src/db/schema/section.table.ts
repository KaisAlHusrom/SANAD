import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  uuid,
} from 'drizzle-orm/pg-core';
import type { SectionCollectionConfig } from '@sanad/contracts';
import { pk, softDelete, timestamps } from '@sanad/database';
import { sectionTypeEnum } from './enums.js';
import { pageTable } from './page.table.js';

/**
 * A section within a page (N4). `type` drives the website renderer (WEB1); `sortOrder`
 * orders sections down the page. Translatable eyebrow/title/subtitle live in
 * `section_translation` (N5). `config` is non-translatable structured data linking the
 * section to a collection (services/work/…) for in-service hydration — `null` = no link.
 */
export const sectionTable = pgTable(
  'section',
  {
    id: pk(),
    pageId: uuid('page_id')
      .notNull()
      .references(() => pageTable.id, { onDelete: 'cascade' }),
    type: sectionTypeEnum('type').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    published: boolean('published').notNull().default(true),
    config: jsonb('config')
      .$type<SectionCollectionConfig | null>()
      .default(null),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [index('section_page_idx').on(table.pageId)],
);

export type SectionRow = typeof sectionTable.$inferSelect;
