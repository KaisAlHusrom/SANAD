import type { SectionNode } from '@sanad/contracts';

/**
 * Collect the distinct `imageMediaId`s of every `image` block in a section tree, so a page
 * can batch-resolve them in one `/media/public` call (avoids N+1). Pure — unit-tested.
 * Non-image blocks and null ids are ignored; order is first-seen, deduped.
 */
export function collectImageIds(sections: readonly SectionNode[]): string[] {
  const ids = new Set<string>();
  for (const section of sections) {
    for (const block of section.blocks) {
      if (block.type === 'image' && block.imageMediaId) {
        ids.add(block.imageMediaId);
      }
    }
  }
  return [...ids];
}
