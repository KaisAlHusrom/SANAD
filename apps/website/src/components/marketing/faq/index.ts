// The FAQ page is a CMS page tree (Phase 5) rendered by the shared `@sanad/web-ui` sections via
// `SectionRenderer` (`app/[locale]/faq/page.tsx`). The bespoke `FaqIndex`/`FaqAccordion` were retired
// (the accordion now lives in `@sanad/web-ui` `FaqSection`); only the coded-default copy remains — the
// F7 fallback source for `marketing-fallback-sections.ts` + metadata.
export * from './faq-copy';
