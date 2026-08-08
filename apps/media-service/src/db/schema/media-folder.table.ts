import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  index,
  pgTable,
  text,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';

/**
 * A media library folder (N4) — a real **tree**: `parentId` self-references, and the explorer
 * nests, renames, moves and deletes through it. `name` is an internal admin label, not website
 * content, so it is not translatable (N5 doesn't apply).
 *
 * The **partial unique index** on `(parent_id, name)` is the invariant that makes a tree
 * navigable: two folders sharing a name under one parent are indistinguishable to a user. It is
 * partial (`WHERE deleted_at IS NULL`) so a soft-deleted folder never blocks re-using its name,
 * and it is `lower(name)` so "Brand" and "brand" collide as a person would expect. Added
 * 2026-07-20 after a silently-swallowed create error let the library accumulate fourteen
 * identically-named "Brand" folders (rules U23).
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
  (table) => [
    index('media_folder_parent_idx').on(table.parentId),
    // NOTE: Postgres treats NULLs as distinct, so this index does NOT constrain root folders
    // (`parent_id IS NULL`). The service's `assertNameFree` covers the root case and gives a
    // friendly 409 everywhere; the index is the backstop for concurrent writes under a parent.
    uniqueIndex('media_folder_parent_name_uidx')
      .on(table.parentId, sql`lower(${table.name})`)
      .where(sql`${table.deletedAt} is null`),
  ],
);

export type MediaFolderRow = typeof mediaFolderTable.$inferSelect;
