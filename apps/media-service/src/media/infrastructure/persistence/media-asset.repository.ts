import { Inject, Injectable } from '@nestjs/common';
import { eq } from 'drizzle-orm';
import {
  BaseRepository,
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { MediaListQuery, Paginated } from '@sanad/contracts';
import type { DbExecutor } from '../../../db/executor.js';
import {
  mediaAssetTable,
  type MediaAssetRow,
  type MediaDb,
} from '../../../db/schema/index.js';
import { mediaAssetModelConfig } from './media-asset.model-config.js';

/** A new asset to persist in the `pending` state (id pre-generated to seed the R2 key). */
export interface PendingAssetInput {
  id: string;
  folderId: string | null;
  key: string;
  filename: string;
  mimeType: string;
  size: number;
}

/** Fields finalized when a presigned upload is confirmed (any may be absent). */
export interface ConfirmAssetPatch {
  width?: number;
  height?: number;
  size?: number;
}

/**
 * Whitelisted media list filters (N7): free-text over `filename`, an exact `folderId`,
 * and a `type` MIME contains-match (e.g. `?type=image` → `mime_type ilike '%image%'`).
 * Never raw column passthrough.
 */
const MEDIA_FILTERS: FilterSpec = {
  search: { kind: 'search', columns: ['filename'] },
  folderId: { kind: 'column', field: 'folderId', op: 'eq' },
  type: { kind: 'column', field: 'mimeType', op: 'contains' },
};

/**
 * Media asset persistence (N1) on the enhanced base. Translatable `alt` lives in
 * `media_asset_translation` and is handled by `MediaAssetTranslationRepository` (N5);
 * this repo owns the base row CRUD + the whitelisted list.
 */
@Injectable()
export class MediaAssetRepository extends BaseRepository<
  typeof mediaAssetTable,
  MediaAssetRow
> {
  constructor(@Inject(DRIZZLE) db: MediaDb, dateTime: DateTimeService) {
    super(db, dateTime, mediaAssetModelConfig);
  }

  /** A live asset by its R2 object key, or null. */
  findByKey(key: string): Promise<MediaAssetRow | null> {
    return this.where('key', 'eq', key).first();
  }

  /** A paginated, searchable, filterable list of live assets. */
  list(query: MediaListQuery): Promise<Paginated<MediaAssetRow>> {
    return this.paginateFiltered(
      { search: query.search, folderId: query.folderId, type: query.type },
      MEDIA_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }

  /**
   * Insert a `pending` asset with a pre-generated id (so the R2 key can embed it).
   * Runs on the caller's executor so it composes inside the upload transaction (MS3).
   */
  async insertPending(
    exec: DbExecutor,
    input: PendingAssetInput,
  ): Promise<MediaAssetRow> {
    const inserted = await exec
      .insert(mediaAssetTable)
      .values({
        id: input.id,
        folderId: input.folderId,
        key: input.key,
        filename: input.filename,
        mimeType: input.mimeType,
        size: input.size,
        status: 'pending',
      })
      .returning();
    const row = inserted[0];
    if (!row) {
      throw new Error('media_asset insert returned no row');
    }
    return row;
  }

  /** Mark an asset `ready`, applying any finalized dimensions/size. Runs on `exec`. */
  async markReady(
    exec: DbExecutor,
    id: string,
    patch: ConfirmAssetPatch,
  ): Promise<MediaAssetRow> {
    const updated = await exec
      .update(mediaAssetTable)
      .set({
        status: 'ready',
        ...(patch.width !== undefined ? { width: patch.width } : {}),
        ...(patch.height !== undefined ? { height: patch.height } : {}),
        ...(patch.size !== undefined ? { size: patch.size } : {}),
        updatedAt: this.dateTime.now().toJSDate(),
      })
      .where(eq(mediaAssetTable.id, id))
      .returning();
    const row = updated[0];
    if (!row) {
      throw new Error(`No media_asset to update for id ${id}`);
    }
    return row;
  }

  /** Soft-delete an asset (`deleted_at`). Runs on `exec` (composes with the outbox, MS3). */
  async softDelete(exec: DbExecutor, id: string): Promise<void> {
    const now = this.dateTime.now().toJSDate();
    await exec
      .update(mediaAssetTable)
      .set({ deletedAt: now, updatedAt: now })
      .where(eq(mediaAssetTable.id, id));
  }
}
