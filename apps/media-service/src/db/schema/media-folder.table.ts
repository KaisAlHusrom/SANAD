import {
  type AnyPgColumn,
  index,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';

/**
 * A media library folder (N4) — a flat organizational label in the MVP. `parentId`
 * self-references to reserve nesting (the admin tree lands in P7). `name` is an internal
 * admin label, not website content, so it is not translatable (N5 doesn't apply).
 */
export const mediaFolderTable = pgTable(
  'media_folder',
  {
    id: pk(),
    parentId: uuid('parent_id').references(
      (): AnyPgColumn => mediaFolderTable.id,
      {
        onDelete: 'set null',
      },
    ),
    name: text('name').notNull(),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [index('media_folder_parent_idx').on(table.parentId)],
);

export type MediaFolderRow = typeof mediaFolderTable.$inferSelect;
