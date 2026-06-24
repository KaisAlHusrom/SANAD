import type { LocalizedText, MediaAsset } from '@sanad/contracts';
import type { MediaAssetRow } from '../../db/schema/index.js';

/**
 * Map a media-asset DB row + its resolved alt text into the `MediaAsset` contract. The
 * public CDN `url` is derived from the key via the storage provider (never persisted).
 * Timestamps are serialized to ISO strings. Pure — unit-tested.
 */
export function assembleMediaAsset(
  row: MediaAssetRow,
  alt: LocalizedText,
  publicUrl: (key: string) => string,
): MediaAsset {
  return {
    id: row.id,
    folderId: row.folderId,
    key: row.key,
    url: publicUrl(row.key),
    filename: row.filename,
    mimeType: row.mimeType,
    size: row.size,
    width: row.width,
    height: row.height,
    status: row.status,
    alt,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
