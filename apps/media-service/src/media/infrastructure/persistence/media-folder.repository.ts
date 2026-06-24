import { Inject, Injectable } from '@nestjs/common';
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
}
