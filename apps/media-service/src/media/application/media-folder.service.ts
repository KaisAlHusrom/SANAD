import { Injectable } from '@nestjs/common';
import type {
  FolderCreateRequest,
  FolderDeletePayload,
  FolderListQuery,
  FolderUpdatePayload,
  MediaFolder,
  MediaFolderTree,
  MediaMoveRequest,
  MediaMoveResult,
} from '@sanad/contracts';
import type { MediaFolderRow } from '../../db/schema/index.js';
import { MediaAssetRepository } from '../infrastructure/persistence/media-asset.repository.js';
import { MediaFolderRepository } from '../infrastructure/persistence/media-folder.repository.js';
import { buildFolderTree, wouldCreateCycle } from './folder-tree.js';
import {
  folderCycle,
  folderNameTaken,
  folderNotEmpty,
  folderNotFound,
} from './media-errors.js';

/**
 * Media folders as a real **tree** (the P7 explorer): create/rename/move/delete, the assembled
 * tree with per-folder counts, and the bulk asset move a drag-and-drop performs.
 *
 * The invariants it defends — each because breaking it stays invisible until it hurts:
 *  - **unique name per parent** — two folders with one name are indistinguishable in a tree, and
 *    a silently-swallowed duplicate create is how the library ended up with fourteen "Brand" rows;
 *  - **no cycles** — a folder moved into its own descendant keeps its row but disappears from
 *    every root, which reads as data loss;
 *  - **no surprise deletion** — deleting a folder never destroys the assets inside it.
 */
@Injectable()
export class MediaFolderService {
  constructor(
    private readonly folders: MediaFolderRepository,
    private readonly assets: MediaAssetRepository,
  ) {}

  async create(req: FolderCreateRequest): Promise<MediaFolder> {
    const parentId = req.parentId ?? null;
    if (parentId !== null) {
      await this.requireFolder(parentId);
    }
    await this.assertNameFree(parentId, req.name);
    const row = await this.folders.create({ name: req.name, parentId });
    return this.toContract(row);
  }

  async list(query: FolderListQuery): Promise<MediaFolder[]> {
    const rows = await this.folders.list(query.parentId);
    return rows.map((row) => this.toContract(row));
  }

  /**
   * The whole tree in ONE round-trip: every folder plus a single grouped count query — the
   * explorer's pane would otherwise issue a count per node.
   */
  async tree(): Promise<MediaFolderTree> {
    const [rows, counts] = await Promise.all([
      this.folders.list(),
      this.assets.countByFolder(),
    ]);
    const folders = rows.map((row) => this.toContract(row));
    const byFolder = new Map<string, number>();
    for (const [folderId, total] of counts) {
      if (folderId !== null) byFolder.set(folderId, total);
    }
    return buildFolderTree(folders, byFolder, counts.get(null) ?? 0);
  }

  /**
   * Rename and/or re-parent. `parentId` is tri-state (absent = keep, null = root, uuid = move),
   * so a rename need not touch the parent and a move to the root is explicit.
   */
  async update(payload: FolderUpdatePayload): Promise<MediaFolder> {
    const current = await this.requireFolder(payload.id);
    const isMoving = 'parentId' in payload;
    const nextParentId = isMoving
      ? (payload.parentId ?? null)
      : current.parentId;

    if (isMoving && nextParentId !== current.parentId) {
      if (nextParentId !== null) {
        await this.requireFolder(nextParentId);
      }
      const all = (await this.folders.list()).map((row) =>
        this.toContract(row),
      );
      if (wouldCreateCycle(all, payload.id, nextParentId)) {
        throw folderCycle();
      }
    }

    const nextName = payload.name ?? current.name;
    // Re-check uniqueness whenever either half of the (parent, name) identity changes.
    if (nextName !== current.name || nextParentId !== current.parentId) {
      await this.assertNameFree(nextParentId, nextName, payload.id);
    }

    const row = await this.folders.update(payload.id, {
      ...(payload.name !== undefined ? { name: payload.name } : {}),
      ...(isMoving ? { parentId: nextParentId } : {}),
    });
    return this.toContract(row);
  }

  /**
   * Delete a folder. `block` (the default) refuses a non-empty folder and reports exactly what
   * is inside; `reparent` lifts its assets and subfolders up one level first. Assets are NEVER
   * destroyed as a side effect of deleting the folder that held them.
   */
  async remove(payload: FolderDeletePayload): Promise<{ id: string }> {
    const folder = await this.requireFolder(payload.id);
    const [assetCount, children] = await Promise.all([
      this.assets.countInFolder(payload.id),
      this.folders.list(payload.id),
    ]);

    if (
      payload.strategy === 'block' &&
      (assetCount > 0 || children.length > 0)
    ) {
      throw folderNotEmpty(folder.name, assetCount, children.length);
    }

    if (assetCount > 0 || children.length > 0) {
      // `reparent`: everything moves up to this folder's own parent, then the folder goes.
      const contained = await this.assets
        .where('folderId', 'eq', payload.id)
        .all();
      await this.assets.moveMany(
        contained.map((asset) => asset.id),
        folder.parentId,
      );
      await this.folders.reparentChildren(payload.id, folder.parentId);
    }

    await this.folders.delete(payload.id);
    return { id: payload.id };
  }

  /**
   * Move assets into a folder (or to the root) in bulk — one request per drag, however many
   * files were selected. Ids that no longer exist come back as `missingIds` rather than being
   * quietly dropped, so the UI can correct its optimistic state instead of lying (U23).
   */
  async moveAssets(req: MediaMoveRequest): Promise<MediaMoveResult> {
    if (req.folderId !== null) {
      await this.requireFolder(req.folderId);
    }
    const movedIds = await this.assets.moveMany(req.ids, req.folderId);
    const moved = new Set(movedIds);
    return {
      movedIds,
      missingIds: req.ids.filter((id) => !moved.has(id)),
    };
  }

  /** Load a folder or fail with a 404 naming it — never an undefined that surfaces later. */
  private async requireFolder(id: string): Promise<MediaFolderRow> {
    const row = await this.folders.findById(id);
    if (!row) throw folderNotFound(id);
    return row;
  }

  /** Refuse a name a live sibling already holds (the DB index agrees; this gives a 409). */
  private async assertNameFree(
    parentId: string | null,
    name: string,
    excludeId?: string,
  ): Promise<void> {
    const clash = await this.folders.findSiblingByName(
      parentId,
      name,
      excludeId,
    );
    if (clash) throw folderNameTaken(name);
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
