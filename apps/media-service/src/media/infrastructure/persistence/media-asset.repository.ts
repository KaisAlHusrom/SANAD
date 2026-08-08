import { Inject, Injectable } from '@nestjs/common';
import { and, eq, inArray, isNull, lt, sql } from 'drizzle-orm';
import {
  BaseRepository,
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import {
  MEDIA_ROOT_FOLDER,
  type MediaListQuery,
  type Paginated,
} from '@sanad/contracts';
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
  status: { kind: 'column', field: 'status', op: 'eq' },
  /**
   * "In no folder at all" — the explorer's root view. A separate whitelisted filter because
   * `folderId eq null` matches nothing in SQL; the service sets it when the caller asks for
   * `folderId=root` (N7: still a whitelisted spec, never raw passthrough).
   */
  rootOnly: { kind: 'column', field: 'folderId', op: 'isNull' },
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

  /**
   * The live, `ready` assets for a set of ids (bulk, avoids N+1) — backs the public
   * resolver. Soft-deleted rows are excluded by the default scope (N2); `pending` uploads
   * are filtered out so an un-finished asset never resolves to a broken URL. Missing ids
   * simply don't appear in the result. Empty input short-circuits (avoids an `IN ()`).
   */
  findManyReadyByIds(ids: readonly string[]): Promise<MediaAssetRow[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.whereIn('id', [...ids])
      .where('status', 'eq', 'ready')
      .all();
  }

  /**
   * A paginated, searchable, filterable list of live assets.
   *
   * `folderId === MEDIA_ROOT_FOLDER` means "the root" — assets filed in NO folder — which a
   * whitelisted `eq` filter cannot express (SQL `= NULL` matches nothing), so it becomes an
   * explicit `IS NULL` predicate instead. Omitting `folderId` still means "everywhere".
   */
  list(query: MediaListQuery): Promise<Paginated<MediaAssetRow>> {
    const isRoot = query.folderId === MEDIA_ROOT_FOLDER;
    return this.paginateFiltered(
      {
        search: query.search,
        folderId: isRoot ? undefined : query.folderId,
        rootOnly: isRoot ? true : undefined,
        type: query.type,
        status: query.status,
      },
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

  /**
   * How many live assets sit in each folder, in ONE grouped query — the explorer's tree would
   * otherwise need a count per node (N+1). Assets with no folder are keyed by `null`, which is
   * the root's own count.
   */
  async countByFolder(): Promise<Map<string | null, number>> {
    const rows = await this.db
      .select({
        folderId: mediaAssetTable.folderId,
        total: sql<number>`count(*)::int`,
      })
      .from(mediaAssetTable)
      .where(isNull(mediaAssetTable.deletedAt))
      .groupBy(mediaAssetTable.folderId);
    return new Map(rows.map((row) => [row.folderId, Number(row.total)]));
  }

  /** Whether any live asset is filed under a folder — the "is it empty?" delete guard. */
  async countInFolder(folderId: string): Promise<number> {
    return this.where('folderId', 'eq', folderId).count();
  }

  /**
   * Move a set of assets into a folder (or to the root when `folderId` is null) in ONE
   * statement — a multi-select drag is one write, not N. Returns the ids that actually moved so
   * the caller can report the rest as missing rather than silently moving fewer than asked.
   */
  async moveMany(
    ids: readonly string[],
    folderId: string | null,
  ): Promise<string[]> {
    if (ids.length === 0) return [];
    const moved = await this.db
      .update(mediaAssetTable)
      .set({ folderId, updatedAt: this.dateTime.now().toJSDate() })
      .where(
        and(
          inArray(mediaAssetTable.id, [...ids]),
          isNull(mediaAssetTable.deletedAt),
        ),
      )
      .returning({ id: mediaAssetTable.id });
    return moved.map((row) => row.id);
  }

  /**
   * Delete `pending` rows whose presigned URL expired. Such a row can NEVER become `ready` — the
   * signature it was created for is dead — so it is not an upload in progress, it is the residue
   * of one that failed (the two rows the owner's blocked uploads left behind). Hard-deleted, not
   * soft: no bytes ever landed in storage, so there is nothing to reconcile or restore.
   */
  async purgeExpiredPending(before: Date): Promise<number> {
    const removed = await this.db
      .delete(mediaAssetTable)
      .where(
        and(
          eq(mediaAssetTable.status, 'pending'),
          lt(mediaAssetTable.createdAt, before),
        ),
      )
      .returning({ id: mediaAssetTable.id });
    return removed.length;
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
