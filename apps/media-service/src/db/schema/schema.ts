import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { outboxTable } from '@sanad/messaging';
import { mediaFolderTable } from './media-folder.table.js';
import { mediaAssetTable } from './media-asset.table.js';
import { mediaAssetTranslationTable } from './media-asset-translation.table.js';

/** The media service's full Drizzle schema (its own DB, MS5) — incl. the Outbox. */
export const schema = {
  mediaFolderTable,
  mediaAssetTable,
  mediaAssetTranslationTable,
  outboxTable,
};

/** The typed Drizzle handle bound to this service's schema (injected via `DRIZZLE`). */
export type MediaDb = NodePgDatabase<typeof schema>;
