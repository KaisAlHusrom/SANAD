import type { LocalizedText } from '../common/localized-text.js';
import type { MediaAssetStatus } from './media-asset-status.zod.types.js';

/**
 * A stored media asset as the gateway returns it. `url` is the fully-resolved public
 * CDN URL (R2 public base + key). `alt` is the translatable accessibility/SEO text,
 * carried in BOTH locales for the admin editor (N5; null-safe — empty strings, never
 * undefined, F7). Pure response shape → `.types` file (U16).
 */
export interface MediaAsset {
  id: string;
  folderId: string | null;
  key: string;
  url: string;
  filename: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  status: MediaAssetStatus;
  alt: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
