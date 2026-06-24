import {
  bigint,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { mediaAssetStatusEnum } from './enums.js';
import { mediaFolderTable } from './media-folder.table.js';

/**
 * A stored media asset (N4). `key` is the R2 object key (unique); the public CDN URL is
 * derived from it at read time (never persisted, so the CDN base can change). `status`
 * is `pending` until the upload is confirmed. Translatable `alt` text lives in
 * `media_asset_translation` (N5), never on this base row.
 */
export const mediaAssetTable = pgTable(
  'media_asset',
  {
    id: pk(),
    folderId: uuid('folder_id').references(() => mediaFolderTable.id, {
      onDelete: 'set null',
    }),
    key: text('key').notNull().unique(),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    size: bigint('size', { mode: 'number' }).notNull(),
    width: integer('width'),
    height: integer('height'),
    status: mediaAssetStatusEnum('status').notNull().default('pending'),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('media_asset_folder_idx').on(table.folderId),
    index('media_asset_status_idx').on(table.status),
  ],
);

export type MediaAssetRow = typeof mediaAssetTable.$inferSelect;
