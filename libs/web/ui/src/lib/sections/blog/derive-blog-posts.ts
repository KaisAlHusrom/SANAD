import {
  type Locale,
  type LocalizedText,
  pickLocalized,
  type SectionNode,
} from '@sanad/contracts';

/** A serialisable log row — the section's hydrated blog post, projected for the teaser list. */
export interface BlogRowData {
  id: string;
  slug: string;
  /** the mono log stamp `YYYY.MM.DD` (a pure string slice; blank when unpublished). */
  dateStamp: string;
  /** the category name in the active locale, blank when uncategorised. */
  category: string;
  title: string;
  excerpt: string;
  /** the cover CDN url — resolved server-side (so only PLAIN data crosses into any client wrapper,
   *  never a function — RSC-safe); `''` when there is no cover or it doesn't resolve. */
  coverUrl: string;
}

/** ISO date → the mono log stamp (`YYYY.MM.DD`) — a pure string slice, never `new Date()` (N3). */
export function logStamp(iso: string | null): string {
  return iso ? iso.slice(0, 10).replaceAll('-', '.') : '';
}

/** Pick the localized value, or a fallback when it is blank in the active locale (F7). */
function localizedOr(
  value: LocalizedText | undefined,
  locale: Locale,
  fallback = '',
): string {
  if (!value) return fallback;
  const picked = pickLocalized(value, locale);
  return picked.trim().length > 0 ? picked : fallback;
}

/**
 * Derive the blog log rows from a section node (pure — the same projection the website's bespoke
 * `BlogSection` did, ported into the lib so `@sanad/web-ui` stays self-contained). Rows come from
 * the section's HYDRATED `blog` collection (`section.collection`, attached in-service; the public
 * path is already published-only — WEB2). The cover is resolved **here** (server-side) via the
 * injected `resolveImageUrl`, so each row carries a plain `coverUrl` string (RSC-safe). Empty when
 * the section links no posts.
 */
export function deriveBlogRows(
  section: SectionNode,
  locale: Locale,
  resolveImageUrl?: (imageMediaId: string) => string,
): BlogRowData[] {
  const items =
    section.collection?.collection === 'blog' ? section.collection.items : [];

  return items.map((post) => ({
    id: post.id,
    slug: post.slug,
    dateStamp: logStamp(post.publishedAt),
    category: post.category ? localizedOr(post.category.name, locale) : '',
    title: localizedOr(post.title, locale),
    excerpt: localizedOr(post.excerpt, locale),
    coverUrl: post.coverMediaId
      ? (resolveImageUrl?.(post.coverMediaId) ?? '')
      : '',
  }));
}
