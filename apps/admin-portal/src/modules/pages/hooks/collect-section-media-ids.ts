import type { SectionNode } from '@sanad/contracts';

/**
 * Collect every media id a section renders — its `image` blocks' `imageMediaId` (U22) + its hydrated
 * collection items' cover/avatar media (portfolio/services/blog carry a `coverMediaId`; testimonials +
 * team carry an `avatarMediaId`). Pure + deduped, so the resolver hook can batch-resolve them to CDN urls
 * in ONE call and feed the shared `SectionBlock`'s `resolveImageUrl` (preview===live — so covers +
 * author photos render in the admin preview exactly as on the live site).
 */
export function collectSectionMediaIds(section: SectionNode): string[] {
  const ids: string[] = [];

  for (const block of section.blocks) {
    if (block.imageMediaId) ids.push(block.imageMediaId);
  }

  const coll = section.collection;
  if (
    coll &&
    (coll.collection === 'portfolio' ||
      coll.collection === 'services' ||
      coll.collection === 'blog')
  ) {
    for (const item of coll.items) {
      if (item.coverMediaId) ids.push(item.coverMediaId);
    }
  } else if (
    coll &&
    (coll.collection === 'testimonials' || coll.collection === 'team')
  ) {
    // testimonials + team carry the person photo on `avatarMediaId` (not a cover)
    for (const item of coll.items) {
      if (item.avatarMediaId) ids.push(item.avatarMediaId);
    }
  }

  return [...new Set(ids)];
}
