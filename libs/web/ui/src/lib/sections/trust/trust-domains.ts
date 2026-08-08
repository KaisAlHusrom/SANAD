import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';

/** One node of the trust constellation — a distinct project category + its live project count. */
export interface TrustDomain {
  id: string;
  name: string;
  /** live published-project count in this domain (real data, WEB1). */
  count: number;
}

/**
 * Derive the constellation's domains from a `trust` section's HYDRATED `portfolio` collection
 * (attached in-service from `section.config` — the section groups the published projects by their
 * embedded category, counting each). Order is first-seen (the collection's sortOrder), matching the
 * bespoke landing so the swap is a visual no-op. Returns `[]` when the section links no portfolio
 * collection (F7 null-safe) — the component then renders nothing live / a placeholder in the editor.
 * Pure (U15) — the single source both the website (live) and the admin preview read.
 */
export function deriveTrustDomains(
  section: SectionNode,
  locale: Locale,
): TrustDomain[] {
  if (section.collection?.collection !== 'portfolio') {
    return [];
  }
  const byCategory = new Map<string, TrustDomain>();
  for (const project of section.collection.items) {
    if (!project.category) continue;
    const existing = byCategory.get(project.category.id);
    if (existing) {
      existing.count += 1;
    } else {
      byCategory.set(project.category.id, {
        id: project.category.id,
        name: pickLocalized(project.category.name, locale),
        count: 1,
      });
    }
  }
  return [...byCategory.values()];
}
