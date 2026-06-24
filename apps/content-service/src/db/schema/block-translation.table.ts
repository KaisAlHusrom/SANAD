import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { blockTable } from './block.table.js';

/**
 * Per-locale block copy (N5). Composite PK `(block_id, locale)`, cascade FK. Nullable
 * columns (a block may carry only an image/stat); reads coalesce to '' (F7).
 */
export const blockTranslationTable = pgTable(
  'block_translation',
  {
    blockId: uuid('block_id')
      .notNull()
      .references(() => blockTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    title: text('title'),
    body: text('body'),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.blockId, table.locale] })],
);

export type BlockTranslationRow = typeof blockTranslationTable.$inferSelect;
