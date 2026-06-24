import { pgTable, primaryKey, text, uuid } from 'drizzle-orm/pg-core';
import { timestamps } from '@sanad/database';
import { mediaAssetTable } from './media-asset.table.js';

/**
 * Per-locale `alt` text for a media asset (N5 — translatable columns get a dedicated
 * table, never multiple languages in the base row). Keyed by the asset + locale.
 * `locale` is validated at the contract edge (`localeSchema`); the DB keeps it a plain
 * text composite-PK column (mirrors `setting_translation`).
 */
export const mediaAssetTranslationTable = pgTable(
  'media_asset_translation',
  {
    mediaAssetId: uuid('media_asset_id')
      .notNull()
      .references(() => mediaAssetTable.id, { onDelete: 'cascade' }),
    locale: text('locale').notNull(),
    alt: text('alt').notNull(),
    ...timestamps(),
  },
  (table) => [primaryKey({ columns: [table.mediaAssetId, table.locale] })],
);

export type MediaAssetTranslationRow =
  typeof mediaAssetTranslationTable.$inferSelect;
