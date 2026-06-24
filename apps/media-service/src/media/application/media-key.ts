import { MEDIA_KEY_PREFIX } from './media.constants.js';

/**
 * Turn a user filename into a safe, lowercase ascii object-key segment. The real
 * (possibly Arabic) filename is preserved on the `media_asset.filename` column; this is
 * only storage addressing, so dropping non-ascii is fine. Falls back to `file` when
 * nothing safe remains. Pure — unit-tested.
 */
export function sanitizeFilename(filename: string): string {
  const cleaned = filename
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, '-') // unsafe runs → a dash
    .replace(/-+/g, '-') // collapse dashes
    .replace(/-*\.-*/g, '.') // drop dashes hugging a dot
    .replace(/\.+/g, '.') // collapse dots
    .replace(/^[-.]+|[-.]+$/g, ''); // trim leading/trailing separators
  return cleaned.length > 0 ? cleaned : 'file';
}

/** The R2 object key for an asset: `uploads/<assetId>/<sanitized filename>`. */
export function buildObjectKey(assetId: string, filename: string): string {
  return `${MEDIA_KEY_PREFIX}/${assetId}/${sanitizeFilename(filename)}`;
}
