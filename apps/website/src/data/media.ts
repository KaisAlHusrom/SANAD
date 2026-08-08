import type { PublicMediaRef } from '@sanad/contracts';
import { fetchEnvelope } from './http/fetch-envelope';

/**
 * Batch-resolve content media ids → public CDN refs in ONE call (WEB1), via the unguarded
 * `GET /media/public` gateway route. A page collects all its image ids up front (see
 * `collectImageIds`) and resolves them together — no N+1. Returns a `id → ref` Map so a
 * synchronous `resolveImageUrl(id)` closure can feed the shared `SectionRenderer`.
 *
 * Empty input short-circuits (no request). Any failure (route absent in an older gateway,
 * timeout, unconfigured storage) degrades to an EMPTY map — the caller then falls back to
 * the bespoke gradient/geometric treatment (F3), never a broken image. In dev, where R2 is
 * unconfigured and nothing is `ready`, this legitimately resolves to empty.
 */
export async function resolveMediaUrls(
  ids: readonly string[],
): Promise<Map<string, PublicMediaRef>> {
  const unique = [...new Set(ids.filter((id) => id.length > 0))];
  if (unique.length === 0) {
    return new Map();
  }
  try {
    const refs = await fetchEnvelope<PublicMediaRef[]>(
      `/media/public?ids=${unique.join(',')}`,
      { revalidate: 60, tags: ['media'] },
    );
    return new Map(refs.map((ref) => [ref.id, ref]));
  } catch {
    return new Map();
  }
}
