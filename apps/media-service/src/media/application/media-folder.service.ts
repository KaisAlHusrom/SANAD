import { Injectable } from '@nestjs/common';
import type {
  FolderCreateRequest,
  FolderListQuery,
  MediaFolder,
} from '@sanad/contracts';
import type { MediaFolderRow } from '../../db/schema/index.js';
import { MediaFolderRepository } from '../infrastructure/persistence/media-folder.repository.js';

/** Media folder reads + creates (a flat slice in the MVP; the admin tree lands in P7). */
@Injectable()
export class MediaFolderService {
  constructor(private readonly folders: MediaFolderRepository) {}

  async create(req: FolderCreateRequest): Promise<MediaFolder> {
    const row = await this.folders.create({
      name: req.name,
      parentId: req.parentId ?? null,
    });
    return this.toContract(row);
  }

  async list(query: FolderListQuery): Promise<MediaFolder[]> {
    const rows = await this.folders.list(query.parentId);
    return rows.map((row) => this.toContract(row));
  }

  private toContract(row: MediaFolderRow): MediaFolder {
    return {
      id: row.id,
      parentId: row.parentId,
      name: row.name,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }
}
