import type { SectionNode } from '@sanad/contracts';
import { useMemo } from 'react';
import { useResolvePublicMediaQuery } from '../../../data/lookups/media-lookup.api';
import { collectSectionMediaIds } from './collect-section-media-ids';

/**
 * The admin media resolver for the pages-builder preview (U5). Collects the section's media ids
 * (block covers + hydrated collection covers — `collectSectionMediaIds`), batch-resolves them to CDN
 * urls via the shared `GET /media/public` bridge (W5), and returns the synchronous
 * `resolveImageUrl(id) → url` closure the shared `@sanad/web-ui` `SectionBlock` expects — so the
 * preview renders real covers + `image` blocks (preview===live), not the placeholder frame. An
 * unresolved id (unknown, pending, unconfigured dev storage) returns `''` → the shared renderer shows
 * its built-in placeholder (F3), never a broken image.
 */
export function useSectionMediaResolver(
  section: SectionNode,
): (imageMediaId: string) => string {
  const ids = useMemo(() => collectSectionMediaIds(section), [section]);
  const { data } = useResolvePublicMediaQuery(ids, { skip: ids.length === 0 });

  return useMemo(() => {
    const map = new Map((data ?? []).map((ref) => [ref.id, ref.url]));
    return (imageMediaId: string) => map.get(imageMediaId) ?? '';
  }, [data]);
}

/**
 * The **page-scope** variant for the preview-first Studio canvas (Phase 4b): the whole page renders
 * at once, so it collects every section's media ids (`collectSectionMediaIds` over all sections,
 * deduped) and batch-resolves them in ONE `GET /media/public` call — the same synchronous
 * `resolveImageUrl(id) → url` closure the shared `SectionRenderer` feeds to each `SectionBlock`.
 * Unresolved ids return `''` → the shared renderer shows its built-in placeholder (F3).
 */
export function usePageMediaResolver(
  sections: SectionNode[],
): (imageMediaId: string) => string {
  const ids = useMemo(
    () => [...new Set(sections.flatMap(collectSectionMediaIds))],
    [sections],
  );
  const { data } = useResolvePublicMediaQuery(ids, { skip: ids.length === 0 });

  return useMemo(() => {
    const map = new Map((data ?? []).map((ref) => [ref.id, ref.url]));
    return (imageMediaId: string) => map.get(imageMediaId) ?? '';
  }, [data]);
}
