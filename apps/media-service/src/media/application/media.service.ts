import { randomUUID } from 'node:crypto';
import { Inject, Injectable, Logger } from '@nestjs/common';
// eslint-disable-next-line no-restricted-imports -- TODO(N14): grandfathered pre-rule; refactor to a TransactionRunner port (db belongs only in repositories).
import { DateTimeService, DRIZZLE } from '@sanad/database';
import { createOutboxRecord, DrizzleOutboxStore } from '@sanad/messaging';
import {
  MEDIA_DELETED_EVENT,
  type LocalizedText,
  type MediaAsset,
  type MediaDeletedEvent,
  type MediaId,
  type MediaListQuery,
  type Paginated,
  type UploadConfirmRequest,
  type UploadSignRequest,
  type UploadSignResult,
} from '@sanad/contracts';
import { MEDIA_ENV, type MediaEnv } from '../../env.js';
import type { MediaDb } from '../../db/schema/index.js';
import { MediaAssetRepository } from '../infrastructure/persistence/media-asset.repository.js';
import { MediaAssetTranslationRepository } from '../infrastructure/persistence/media-asset-translation.repository.js';
import { StorageProvider } from '../infrastructure/storage/storage.provider.js';
import { assembleMediaAsset } from './media.assembler.js';
import { mediaNotFound, storageUnavailable } from './media-errors.js';
import { ALLOWED_MIME_TYPES } from './media.constants.js';
import { buildObjectKey } from './media-key.js';
import { assertUploadAllowed } from './upload-policy.js';

/** An empty, null-safe alt map — the default when an asset has no translations (F7). */
const EMPTY_ALT: LocalizedText = { ar: '', en: '' };

/**
 * Media reads + the signed-upload lifecycle. `signUpload` validates against the coded
 * policy, persists a `pending` asset (+ optional alt) and mints a presigned PUT URL;
 * `confirmUpload` marks it `ready`. `delete` soft-deletes + enqueues `media.deleted` in
 * ONE transaction (MS3), then best-effort removes the R2 object. Storage credentials are
 * resolved behind the provider's seam (env now, vault later) — never read here.
 */
@Injectable()
export class MediaService {
  private readonly logger = new Logger(MediaService.name);

  constructor(
    private readonly assets: MediaAssetRepository,
    private readonly translations: MediaAssetTranslationRepository,
    private readonly storage: StorageProvider,
    private readonly clock: DateTimeService,
    @Inject(MEDIA_ENV) private readonly env: MediaEnv,
    @Inject(DRIZZLE) private readonly db: MediaDb,
  ) {}

  /** Validate, create a pending asset, and mint a presigned PUT URL. */
  async signUpload(req: UploadSignRequest): Promise<UploadSignResult> {
    if (!this.storage.isConfigured()) {
      throw storageUnavailable();
    }
    assertUploadAllowed(
      req.contentType,
      req.size,
      this.env.MEDIA_MAX_UPLOAD_BYTES,
      ALLOWED_MIME_TYPES,
    );

    const assetId = randomUUID();
    const key = buildObjectKey(assetId, req.filename);
    const alt = req.alt ?? EMPTY_ALT;

    const row = await this.db.transaction(async (tx) => {
      const asset = await this.assets.insertPending(tx, {
        id: assetId,
        folderId: req.folderId ?? null,
        key,
        filename: req.filename,
        mimeType: req.contentType,
        size: req.size,
      });
      if (req.alt) {
        await this.translations.upsertAll(tx, assetId, req.alt);
      }
      return asset;
    });

    const signed = await this.storage.signUpload({
      key,
      contentType: req.contentType,
    });
    const expiresAt =
      this.clock
        .now()
        .plus({ seconds: signed.expiresInSeconds })
        .toUTC()
        .toISO() ?? this.clock.nowIso();

    return {
      asset: assembleMediaAsset(row, alt, (k) => this.storage.publicUrl(k)),
      upload: {
        url: signed.url,
        method: 'PUT',
        headers: signed.headers,
        expiresAt,
      },
    };
  }

  /** Mark a pending asset `ready`, capturing dimensions/size and finalizing alt. */
  async confirmUpload(req: UploadConfirmRequest): Promise<MediaAsset> {
    if (!this.storage.isConfigured()) {
      throw storageUnavailable();
    }
    const existing = await this.assets.find(req.assetId);
    if (!existing) {
      throw mediaNotFound(req.assetId);
    }

    const meta = await this.storage.head(existing.key);

    const row = await this.db.transaction(async (tx) => {
      const updated = await this.assets.markReady(tx, req.assetId, {
        width: req.width,
        height: req.height,
        size: meta && meta.size > 0 ? meta.size : undefined,
      });
      if (req.alt) {
        await this.translations.upsertAll(tx, req.assetId, req.alt);
      }
      return updated;
    });

    const alt = await this.translations.altFor(req.assetId);
    return assembleMediaAsset(row, alt, (k) => this.storage.publicUrl(k));
  }

  /** A paginated, searchable, filterable page of assets (alt resolved per row). */
  async list(query: MediaListQuery): Promise<Paginated<MediaAsset>> {
    const page = await this.assets.list(query);
    const altMap = await this.translations.altForAssets(
      page.items.map((asset) => asset.id),
    );
    const items = page.items.map((row) =>
      assembleMediaAsset(row, altMap.get(row.id) ?? EMPTY_ALT, (k) =>
        this.storage.publicUrl(k),
      ),
    );
    return { items, meta: page.meta };
  }

  /** A single asset by id. */
  async get(id: string): Promise<MediaAsset> {
    const row = await this.assets.find(id);
    if (!row) {
      throw mediaNotFound(id);
    }
    const alt = await this.translations.altFor(id);
    return assembleMediaAsset(row, alt, (k) => this.storage.publicUrl(k));
  }

  /** Soft-delete an asset + emit `media.deleted` (MS3), then best-effort drop the object. */
  async delete(id: string): Promise<MediaId> {
    const row = await this.assets.find(id);
    if (!row) {
      throw mediaNotFound(id);
    }

    await this.db.transaction(async (tx) => {
      await this.assets.softDelete(tx, id);
      const outbox = new DrizzleOutboxStore(tx, this.clock);
      const event: MediaDeletedEvent = { id, key: row.key };
      await outbox.enqueue(
        createOutboxRecord(MEDIA_DELETED_EVENT, event, this.clock.nowIso()),
      );
    });

    if (this.storage.isConfigured()) {
      try {
        await this.storage.delete(row.key);
      } catch (error) {
        this.logger.warn(
          `R2 delete failed for ${row.key} (the media.deleted event lets consumers reconcile): ${String(error)}`,
        );
      }
    }
    return { id };
  }
}
