import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `blog` ship's-log teaser (F7/WEB1) — the safety net so the section head
 * + the log affordances (the "all" link, the empty state) are never blank. Lives WITH the shared
 * component (single source): the website (live) and the admin preview show the identical fallback.
 * Byte-copied from the website's `LANDING_COPY.blog` so the swap introduces no copy regression. The
 * log ROWS come from the section's hydrated `blog` collection (date/category/title/excerpt/cover).
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const BLOG_COPY = {
  eyebrow: t('٠٧ · سجل الرحلة', '07 · SHIP’S LOG'),
  title: t('ممّا نتعلّمه ونحن نبني', 'What we learn as we build'),
  all: t('كل المقالات', 'All articles'),
  empty: t(
    'أولى التدوينات قيد الكتابة — عُد قريبًا.',
    'The first entries are being written — check back soon.',
  ),
} as const;
