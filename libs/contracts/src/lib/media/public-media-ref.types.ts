import type { LocalizedText } from '../common/localized-text.js';

/**
 * The public-safe slim of a media asset (WEB1): just what the website needs to render an
 * image — the resolved CDN `url`, the translatable `alt`, and intrinsic dimensions for
 * layout. It deliberately omits key/status/folder/timestamps (those are admin-only). The
 * public batch resolver returns one per `ready`, non-deleted id it finds. Pure shape (U16).
 */
export interface PublicMediaRef {
  id: string;
  url: string;
  alt: LocalizedText;
  width: number | null;
  height: number | null;
}
