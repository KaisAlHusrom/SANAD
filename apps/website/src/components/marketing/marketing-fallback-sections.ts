import type { BlockNode, LocalizedText, SectionNode } from '@sanad/contracts';
import { ABOUT_COPY } from './about/about-copy';
import { FAQ_COPY } from './faq/faq-copy';
import { PROCESS_COPY } from './process/process-copy';
import { PORTFOLIO_COPY } from './portfolio/portfolio-copy';
import { SERVICES_COPY } from './services/services-copy';
import { BLOG_COPY } from './blog/blog-copy';
import { CAREERS_COPY } from './careers/careers-copy';
import { CONTACT_COPY } from './contact/contact-copy';
import { REQUEST_COPY } from './request/request-copy';

/**
 * Coded-default `SectionNode` trees (F3/F7) for the About + FAQ marketing pages, so the shared
 * `@sanad/web-ui` components always have a tree to render even when `getPage('about'|'faq')` fails
 * (gateway down / un-seeded DB). Assembled FROM the page's `*-copy.ts` constants (single source, no
 * copy duplication). Mirrors the seeded page trees: marketing hero + closing CTA + prose bands are
 * `richtext` sections (head + a CTA-button / prose block); the `team`/`faq` sections carry NO
 * hydrated collection here, so they render nothing until the real tree loads (F3 — a down backend
 * shows the coded chrome without live records, never a blank page).
 */
const BLANK: LocalizedText = { ar: '', en: '' };

let seq = 0;
const nid = (): string => `mk-fallback-${(seq += 1)}`;

function ctaBlock(href: string, label: LocalizedText): BlockNode {
  return {
    id: nid(),
    type: 'cta',
    sortOrder: 0,
    data: { href, variant: 'primary' },
    imageMediaId: null,
    title: label,
    body: BLANK,
  };
}

function proseBlock(html: LocalizedText): BlockNode {
  return {
    id: nid(),
    type: 'richtext',
    sortOrder: 0,
    data: {},
    imageMediaId: null,
    title: BLANK,
    body: html,
  };
}

function section(
  overrides: Partial<SectionNode> & Pick<SectionNode, 'type'>,
): SectionNode {
  return {
    id: nid(),
    sortOrder: 0,
    published: true,
    eyebrow: BLANK,
    title: BLANK,
    subtitle: BLANK,
    blocks: [],
    config: null,
    collection: null,
    ...overrides,
  };
}

/** `<p>` per story paragraph, both locales (assembled from the copy). */
const storyHtml: LocalizedText = {
  ar: `<p>${ABOUT_COPY.story.body1.ar}</p><p>${ABOUT_COPY.story.body2.ar}</p>`,
  en: `<p>${ABOUT_COPY.story.body1.en}</p><p>${ABOUT_COPY.story.body2.en}</p>`,
};

/** `<h3>` + `<p>` per value, both locales (assembled from the copy). */
const valuesHtml: LocalizedText = {
  ar: ABOUT_COPY.values.items
    .map((v) => `<h3>${v.title.ar}</h3><p>${v.desc.ar}</p>`)
    .join(''),
  en: ABOUT_COPY.values.items
    .map((v) => `<h3>${v.title.en}</h3><p>${v.desc.en}</p>`)
    .join(''),
};

export const FALLBACK_ABOUT_SECTIONS: SectionNode[] = [
  section({
    type: 'richtext',
    eyebrow: ABOUT_COPY.hero.eyebrow,
    title: ABOUT_COPY.hero.title,
    subtitle: ABOUT_COPY.hero.subtitle,
    blocks: [ctaBlock('/contact', ABOUT_COPY.hero.talk)],
  }),
  section({
    type: 'richtext',
    eyebrow: ABOUT_COPY.story.eyebrow,
    title: ABOUT_COPY.story.title,
    blocks: [proseBlock(storyHtml)],
  }),
  section({
    type: 'richtext',
    eyebrow: ABOUT_COPY.values.eyebrow,
    title: ABOUT_COPY.values.title,
    blocks: [proseBlock(valuesHtml)],
  }),
  section({
    type: 'team',
    eyebrow: ABOUT_COPY.team.eyebrow,
    title: ABOUT_COPY.team.title,
  }),
  section({
    type: 'richtext',
    title: ABOUT_COPY.cta.title,
    subtitle: ABOUT_COPY.cta.subtitle,
    blocks: [ctaBlock('/request-a-project', ABOUT_COPY.cta.talk)],
  }),
];

export const FALLBACK_FAQ_SECTIONS: SectionNode[] = [
  section({
    type: 'richtext',
    eyebrow: FAQ_COPY.hero.eyebrow,
    title: FAQ_COPY.hero.title,
    subtitle: FAQ_COPY.hero.subtitle,
    blocks: [ctaBlock('/contact', FAQ_COPY.hero.talk)],
  }),
  section({
    type: 'faq',
    eyebrow: FAQ_COPY.list.eyebrow,
    title: FAQ_COPY.list.title,
  }),
  section({
    type: 'richtext',
    eyebrow: FAQ_COPY.cta.eyebrow,
    title: FAQ_COPY.cta.title,
    subtitle: FAQ_COPY.cta.subtitle,
    blocks: [ctaBlock('/contact', FAQ_COPY.cta.talk)],
  }),
];

/*
 * The Phase-5 HYBRID marketing pages (process / portfolio / services / blog): only the editable
 * hero + closing-CTA `richtext` bands are seeded (the page body — phases, gallery, services grid,
 * article list — stays a website component rendered between them). So each fallback is just the two
 * bands, assembled from the page's `*_COPY.hero` + `*_COPY.cta` (single source, no duplication).
 */
export const FALLBACK_PROCESS_SECTIONS: SectionNode[] = [
  section({
    type: 'richtext',
    eyebrow: PROCESS_COPY.hero.eyebrow,
    title: PROCESS_COPY.hero.title,
    subtitle: PROCESS_COPY.hero.subtitle,
    blocks: [ctaBlock('/request-a-project', PROCESS_COPY.hero.talk)],
  }),
  section({
    type: 'richtext',
    title: PROCESS_COPY.cta.title,
    subtitle: PROCESS_COPY.cta.subtitle,
    blocks: [ctaBlock('/request-a-project', PROCESS_COPY.cta.talk)],
  }),
];

export const FALLBACK_PORTFOLIO_SECTIONS: SectionNode[] = [
  section({
    type: 'richtext',
    eyebrow: PORTFOLIO_COPY.hero.eyebrow,
    title: PORTFOLIO_COPY.hero.title,
    subtitle: PORTFOLIO_COPY.hero.subtitle,
    blocks: [ctaBlock('/request-a-project', PORTFOLIO_COPY.hero.talk)],
  }),
  section({
    type: 'richtext',
    eyebrow: PORTFOLIO_COPY.cta.eyebrow,
    title: PORTFOLIO_COPY.cta.title,
    subtitle: PORTFOLIO_COPY.cta.subtitle,
    blocks: [ctaBlock('/request-a-project', PORTFOLIO_COPY.cta.talk)],
  }),
];

export const FALLBACK_SERVICES_SECTIONS: SectionNode[] = [
  section({
    type: 'richtext',
    eyebrow: SERVICES_COPY.hero.eyebrow,
    title: SERVICES_COPY.hero.title,
    subtitle: SERVICES_COPY.hero.subtitle,
    blocks: [ctaBlock('/contact', SERVICES_COPY.hero.talk)],
  }),
  section({
    type: 'richtext',
    eyebrow: SERVICES_COPY.cta.eyebrow,
    title: SERVICES_COPY.cta.title,
    subtitle: SERVICES_COPY.cta.subtitle,
    blocks: [ctaBlock('/contact', SERVICES_COPY.cta.talk)],
  }),
];

export const FALLBACK_BLOG_SECTIONS: SectionNode[] = [
  section({
    type: 'richtext',
    eyebrow: BLOG_COPY.hero.eyebrow,
    title: BLOG_COPY.hero.title,
    subtitle: BLOG_COPY.hero.subtitle,
    blocks: [ctaBlock('/request-a-project', BLOG_COPY.hero.talk)],
  }),
  section({
    type: 'richtext',
    eyebrow: BLOG_COPY.cta.eyebrow,
    title: BLOG_COPY.cta.title,
    subtitle: BLOG_COPY.cta.subtitle,
    blocks: [ctaBlock('/request-a-project', BLOG_COPY.cta.talk)],
  }),
];

/**
 * Careers (Phase 5, FULL CMS) — four editable `richtext` bands (hero + culture + openings + closing
 * CTA), assembled from `CAREERS_COPY` (single source). Culture/openings render as prose blocks
 * (`<h3>`/`<p>`) — the coded card grid was retired for full studio editability (mirrors `/about`).
 * Careers has no lead form, so the hero + closing CTA both route to `/contact`.
 */
const cultureHtml: LocalizedText = {
  ar: CAREERS_COPY.culture.items
    .map((i) => `<h3>${i.title.ar}</h3><p>${i.desc.ar}</p>`)
    .join(''),
  en: CAREERS_COPY.culture.items
    .map((i) => `<h3>${i.title.en}</h3><p>${i.desc.en}</p>`)
    .join(''),
};

export const FALLBACK_CAREERS_SECTIONS: SectionNode[] = [
  section({
    type: 'richtext',
    eyebrow: CAREERS_COPY.hero.eyebrow,
    title: CAREERS_COPY.hero.title,
    subtitle: CAREERS_COPY.hero.subtitle,
    blocks: [ctaBlock('/contact', CAREERS_COPY.hero.talk)],
  }),
  section({
    type: 'richtext',
    eyebrow: CAREERS_COPY.culture.eyebrow,
    title: CAREERS_COPY.culture.title,
    blocks: [proseBlock(cultureHtml)],
  }),
  section({
    type: 'richtext',
    eyebrow: CAREERS_COPY.openings.eyebrow,
    title: CAREERS_COPY.openings.title,
    blocks: [
      proseBlock({
        ar: `<p>${CAREERS_COPY.openings.body.ar}</p>`,
        en: `<p>${CAREERS_COPY.openings.body.en}</p>`,
      }),
      ctaBlock('/contact', CAREERS_COPY.openings.talk),
    ],
  }),
  section({
    type: 'richtext',
    title: CAREERS_COPY.cta.title,
    subtitle: CAREERS_COPY.cta.subtitle,
    blocks: [ctaBlock('/contact', CAREERS_COPY.cta.talk)],
  }),
];

/*
 * The two lead-form pages (contact / request-a-project) are CMS-chrome pages: a single editable
 * `richtext` hero band above the KEPT bespoke form. No CTA block + no closing band — the form is the
 * conversion. Assembled from `CONTACT_COPY.hero` / `REQUEST_COPY.hero` (single source).
 */
export const FALLBACK_CONTACT_SECTIONS: SectionNode[] = [
  section({
    type: 'richtext',
    eyebrow: CONTACT_COPY.hero.eyebrow,
    title: CONTACT_COPY.hero.title,
    subtitle: CONTACT_COPY.hero.subtitle,
  }),
];

export const FALLBACK_REQUEST_SECTIONS: SectionNode[] = [
  section({
    type: 'richtext',
    eyebrow: REQUEST_COPY.hero.eyebrow,
    title: REQUEST_COPY.hero.title,
    subtitle: REQUEST_COPY.hero.subtitle,
  }),
];
