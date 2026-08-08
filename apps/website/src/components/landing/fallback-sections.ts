import type { LocalizedText, SectionNode } from '@sanad/contracts';

/**
 * Coded-default `SectionNode`s (F3/F7) so the shared `@sanad/web-ui` per-type components always
 * have a node to render — even when `getPage('landing')` fails or the CMS hasn't seeded a section.
 * The blank localized fields make the shared component fall back to ITS coded copy (`HERO_COPY`,
 * `STATS_COPY`), so the live page is never blank (U9). Empty `blocks` → the hero shows its default
 * proof strip; the stats section (no `stat` blocks) renders nothing in `mode='live'`. `config`/
 * `collection` are null — a fallback links no collection, so a collection-backed section (services)
 * renders nothing until the real hydrated tree loads.
 */
const BLANK: LocalizedText = { ar: '', en: '' };

export const FALLBACK_HERO_SECTION: SectionNode = {
  id: 'hero-fallback',
  type: 'hero',
  sortOrder: 0,
  published: true,
  eyebrow: BLANK,
  title: BLANK,
  subtitle: BLANK,
  blocks: [],
  config: null,
  collection: null,
};

export const FALLBACK_STATS_SECTION: SectionNode = {
  id: 'stats-fallback',
  type: 'stats',
  sortOrder: 0,
  published: true,
  eyebrow: BLANK,
  title: BLANK,
  subtitle: BLANK,
  blocks: [],
  config: null,
  collection: null,
};

export const FALLBACK_SERVICES_SECTION: SectionNode = {
  id: 'services-fallback',
  type: 'services',
  sortOrder: 0,
  published: true,
  eyebrow: BLANK,
  title: BLANK,
  subtitle: BLANK,
  // no hydrated collection → the shared ServicesSection renders nothing live until the tree loads
  blocks: [],
  config: null,
  collection: null,
};

export const FALLBACK_CTA_SECTION: SectionNode = {
  id: 'cta-fallback',
  type: 'cta',
  sortOrder: 0,
  published: true,
  eyebrow: BLANK,
  title: BLANK,
  subtitle: BLANK,
  // no feature blocks → the shared CtaSection renders its coded `CTA_COPY.steps` (F7)
  blocks: [],
  config: null,
  collection: null,
};

export const FALLBACK_PROCESS_SECTION: SectionNode = {
  id: 'process-fallback',
  type: 'process',
  sortOrder: 0,
  published: true,
  eyebrow: BLANK,
  title: BLANK,
  subtitle: BLANK,
  // no step blocks → the shared ProcessSection renders nothing live, a placeholder in the editor
  blocks: [],
  config: null,
  collection: null,
};

export const FALLBACK_TRUST_SECTION: SectionNode = {
  id: 'trust-fallback',
  type: 'trust',
  sortOrder: 0,
  published: true,
  eyebrow: BLANK,
  title: BLANK,
  subtitle: BLANK,
  // no hydrated portfolio collection → the shared TrustSection renders nothing live until the tree
  // loads (its constellation stars come from the portfolio categories — F3/F7)
  blocks: [],
  config: null,
  collection: null,
};

export const FALLBACK_WORK_SECTION: SectionNode = {
  id: 'work-fallback',
  type: 'work',
  sortOrder: 0,
  published: true,
  eyebrow: BLANK,
  title: BLANK,
  subtitle: BLANK,
  // no hydrated portfolio collection → the shared WorksSection renders nothing live until the tree
  // loads (its orbit cards are the hydrated case-study projects — F3/F7)
  blocks: [],
  config: null,
  collection: null,
};

export const FALLBACK_TESTIMONIALS_SECTION: SectionNode = {
  id: 'testimonials-fallback',
  type: 'testimonials',
  sortOrder: 0,
  published: true,
  eyebrow: BLANK,
  title: BLANK,
  subtitle: BLANK,
  // no hydrated testimonials collection → the shared TestimonialsSection renders nothing live
  // until the tree loads (its quote cards are the hydrated testimonials — F3/F7)
  blocks: [],
  config: null,
  collection: null,
};

export const FALLBACK_BLOG_SECTION: SectionNode = {
  id: 'blog-fallback',
  type: 'blog',
  sortOrder: 0,
  published: true,
  eyebrow: BLANK,
  title: BLANK,
  subtitle: BLANK,
  // no hydrated blog collection → the shared BlogSection shows its explicit empty state (never null)
  // with its coded `BLOG_COPY` head until the tree loads (F3/F7)
  blocks: [],
  config: null,
  collection: null,
};
