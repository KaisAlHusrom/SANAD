import { index, integer, jsonb, pgTable, uuid } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { blockTypeEnum } from './enums.js';
import { sectionTable } from './section.table.js';

/**
 * A block within a section (N4). `data` holds non-translatable structured values (stat
 * numbers in Western digits, icon keys, urls); translatable `title`/`body` live in
 * `block_translation` (N5). `imageMediaId` is a SOFT reference to a media asset — nullable,
 * NOT a cross-service FK (MS5); the `media.deleted` consumer nulls it on reconcile.
 */
export const blockTable = pgTable(
  'block',
  {
    id: pk(),
    sectionId: uuid('section_id')
      .notNull()
      .references(() => sectionTable.id, { onDelete: 'cascade' }),
    type: blockTypeEnum('type').notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    data: jsonb('data').$type<Record<string, unknown>>().notNull().default({}),
    imageMediaId: uuid('image_media_id'),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('block_section_idx').on(table.sectionId),
    index('block_image_media_idx').on(table.imageMediaId),
  ],
);

export type BlockRow = typeof blockTable.$inferSelect;
