import type { PublicMediaRef } from '@sanad/contracts';

/**
 * Build the synchronous `resolveImageUrl(id) → url` closure the shared `SectionRenderer`/
 * `BlockRenderer` expect, backed by a pre-resolved `id → PublicMediaRef` map (from
 * `resolveMediaUrls`). An unresolved id (unknown, pending, or unconfigured storage in dev)
 * returns `''` → the renderer shows its built-in image placeholder (F3). The URL itself
 * comes from media-service (R2 public base + key); the website never builds it.
 */
export function makeImageResolver(
  map: ReadonlyMap<string, PublicMediaRef>,
): (imageMediaId: string) => string {
  return (imageMediaId) => map.get(imageMediaId)?.url ?? '';
}
