import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import { BaseRepository, DateTimeService, DRIZZLE } from '@sanad/database';
import {
  mediaFolderTable,
  type MediaFolderRow,
  type MediaDb,
} from '../../../db/schema/index.js';
import { mediaFolderModelConfig } from './media-folder.model-config.js';

/** Media folder persistence (N1) on the enhanced base. Flat list in the MVP. */
@Injectable()
export class MediaFolderRepository extends BaseRepository<
  typeof mediaFolderTable,
  MediaFolderRow
> {
  constructor(@Inject(DRIZZLE) db: MediaDb, dateTime: DateTimeService) {
    super(db, dateTime, mediaFolderModelConfig);
  }

  /** All live folders, optionally under a parent (newest first). */
  list(parentId?: string): Promise<MediaFolderRow[]> {
    const base =
      parentId === undefined
        ? this.query()
        : this.where('parentId', 'eq', parentId);
    return base.all();
  }

  /** One live folder by id, or null. */
  findById(id: string): Promise<MediaFolderRow | null> {
    return this.where('id', 'eq', id).first();
  }

  /**
   * A live sibling with the same name under the same parent — the uniqueness the DB index
   * enforces, checked first so the user gets "that folder already exists" instead of a raw
   * constraint violation. `parentId` null means the root, where `eq` cannot express null.
   */
  async findSiblingByName(
    parentId: string | null,
    name: string,
    excludeId?: string,
  ): Promise<MediaFolderRow | null> {
    const rows = await this.list(parentId ?? undefined);
    const normalized = name.trim().toLowerCase();
    return (
      rows.find(
        (row) =>
          row.parentId === parentId &&
          row.name.trim().toLowerCase() === normalized &&
          row.id !== excludeId,
      ) ?? null
    );
  }

  /**
   * Re-parent every DIRECT child of a folder in one statement — what deleting a folder with the
   * `reparent` strategy does to its subfolders. A bulk `WHERE parent_id = …`, so it can't be
   * expressed through the base repo's by-id `update`.
   */
  async reparentChildren(
    folderId: string,
    nextParentId: string | null,
  ): Promise<void> {
    await this.db
      .update(mediaFolderTable)
      .set({
        parentId: nextParentId,
        updatedAt: this.dateTime.now().toJSDate(),
      })
      .where(eq(mediaFolderTable.parentId, folderId));
  }
}
