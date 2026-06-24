import { Inject, Injectable } from '@nestjs/common';
import { inArray } from 'drizzle-orm';
import { DateTimeService, DRIZZLE } from '@sanad/database';
import { LOCALES, type Locale, type LocalizedText } from '@sanad/contracts';
import type { DbExecutor } from '../../../db/executor.js';
import {
  mediaAssetTranslationTable,
  type MediaAssetTranslationRow,
  type MediaDb,
} from '../../../db/schema/index.js';

/** A locale-keyed map of empty alt text — the null-safe base every read starts from (F7). */
function emptyAlt(): LocalizedText {
  return { ar: '', en: '' };
}

/**
 * The per-locale `alt` text repository for media assets (N5). Reads assemble `{ ar, en }`
 * (null-safe — empty strings, never undefined, F7); `upsert` writes one row per (asset,
 * locale) on the caller's executor so it composes inside a transaction (MS3). No
 * BaseRepository — the table has a composite PK and no soft-delete (mirrors
 * `SettingTranslationRepository`).
 */
@Injectable()
export class MediaAssetTranslationRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: MediaDb,
    private readonly clock: DateTimeService,
  ) {}

  /** All translation rows for a set of assets (bulk, avoids N+1). */
  async findForAssets(
    assetIds: readonly string[],
  ): Promise<MediaAssetTranslationRow[]> {
    if (assetIds.length === 0) {
      return [];
    }
    return this.db
      .select()
      .from(mediaAssetTranslationTable)
      .where(inArray(mediaAssetTranslationTable.mediaAssetId, [...assetIds]));
  }

  /** `assetId → { ar, en }` for a set of assets (always a complete LocalizedText). */
  async altForAssets(
    assetIds: readonly string[],
  ): Promise<Map<string, LocalizedText>> {
    const result = new Map<string, LocalizedText>();
    const rows = await this.findForAssets(assetIds);
    for (const row of rows) {
      const current = result.get(row.mediaAssetId) ?? emptyAlt();
      if (row.locale === 'ar' || row.locale === 'en') {
        current[row.locale] = row.alt;
      }
      result.set(row.mediaAssetId, current);
    }
    return result;
  }

  /** The `{ ar, en }` alt text for a single asset (empty strings when unset). */
  async altFor(assetId: string): Promise<LocalizedText> {
    const map = await this.altForAssets([assetId]);
    return map.get(assetId) ?? emptyAlt();
  }

  /** Write both locales' alt text for an asset on the given executor (composes in a tx). */
  async upsertAll(
    exec: DbExecutor,
    assetId: string,
    alt: LocalizedText,
  ): Promise<void> {
    for (const locale of LOCALES) {
      await this.upsert(exec, assetId, locale, alt[locale]);
    }
  }

  /** Insert or update one locale's alt text for an asset. */
  async upsert(
    exec: DbExecutor,
    assetId: string,
    locale: Locale,
    alt: string,
  ): Promise<void> {
    await exec
      .insert(mediaAssetTranslationTable)
      .values({ mediaAssetId: assetId, locale, alt })
      .onConflictDoUpdate({
        target: [
          mediaAssetTranslationTable.mediaAssetId,
          mediaAssetTranslationTable.locale,
        ],
        set: { alt, updatedAt: this.clock.now().toJSDate() },
      });
  }
}
