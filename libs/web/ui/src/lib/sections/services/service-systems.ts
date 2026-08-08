import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import { readString } from '../../block-renderer/block-data.js';
import { SERVICES_COPY } from './services-copy.js';

const bySortOrder = <T extends { sortOrder: number }>(a: T, b: T) =>
  a.sortOrder - b.sortOrder;

/** One capability bullet on a service card. */
export interface ServiceCapView {
  id: string;
  text: string;
}

/** A fully-resolved service card — collection item copy + its joined capabilities/tech. */
export interface ServiceCardView {
  id: string;
  slug: string;
  index: number;
  title: string;
  summary: string;
  caps: ServiceCapView[];
  tech: string;
}

/**
 * Derive the `services` cards from a section node (pure — the same reads the website's
 * `section-content` join did, ported into the lib so `@sanad/web-ui` stays self-contained). The
 * cards come from the section's HYDRATED collection (`section.collection`, attached in-service —
 * Phase 3); each card's capability bullets are its `feature` sibling blocks joined by
 * `data.service === slug` (mono `tech` signature from a `text` sibling likewise), null-safe to the
 * coded `SERVICES_COPY.systems[slug]` fallback (U9/F7). Empty when the section links no services.
 */
export function deriveServiceCards(
  section: SectionNode,
  locale: Locale,
): ServiceCardView[] {
  const items =
    section.collection?.collection === 'services'
      ? section.collection.items
      : [];
  const features = [...section.blocks]
    .sort(bySortOrder)
    .filter((block) => block.type === 'feature');
  const texts = [...section.blocks]
    .sort(bySortOrder)
    .filter((block) => block.type === 'text');

  return items.map((service, index) => {
    const fallback = SERVICES_COPY.systems[service.slug];
    const capBlocks = features.filter(
      (block) => readString(block.data, 'service') === service.slug,
    );
    const caps: ServiceCapView[] =
      capBlocks.length > 0
        ? capBlocks
            .map((block) => ({
              id: block.id,
              text: pickLocalized(block.title, locale),
            }))
            .filter((cap) => cap.text.trim().length > 0)
        : (fallback?.caps ?? []).map((cap, capIndex) => ({
            id: `${service.slug}-cap-${capIndex}`,
            text: pickLocalized(cap, locale),
          }));
    const techBlock = texts.find(
      (block) => readString(block.data, 'service') === service.slug,
    );
    const tech =
      (techBlock ? readString(techBlock.data, 'tech') : '') ||
      fallback?.tech ||
      '';

    return {
      id: service.id,
      slug: service.slug,
      index,
      title: pickLocalized(service.title, locale),
      summary: pickLocalized(service.summary, locale),
      caps,
      tech,
    };
  });
}
