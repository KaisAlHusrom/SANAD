import type { MediaAsset } from '@sanad/contracts';

interface UseMediaCardResult {
  isImage: boolean;
}

/** Per-card display derivations (U5 — the card stays presentational). */
export function useMediaCard(asset: MediaAsset): UseMediaCardResult {
  return { isImage: asset.mimeType.startsWith('image/') };
}
