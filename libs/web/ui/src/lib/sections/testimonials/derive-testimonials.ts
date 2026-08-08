import {
  type Locale,
  type LocalizedText,
  pickLocalized,
  type SectionNode,
} from '@sanad/contracts';

/** A serialisable testimonial card — the section's hydrated testimonial, projected for the wall. */
export interface TestimonialCardData {
  id: string;
  /** the author's proper name (non-translatable). */
  authorName: string;
  /** the author's role in the active locale, blank when unset. */
  role: string;
  /** the company name, else the localized company descriptor, else blank. */
  company: string;
  /** the quote in the active locale. */
  quote: string;
  /** the stored rating, clamped 0–5 (rendered as diamond marks, never ★). */
  rating: number;
  /** the author avatar CDN url — resolved server-side (so only PLAIN data crosses into any client
   *  wrapper, never a function — RSC-safe); `''` when there is no avatar or it doesn't resolve. */
  avatarUrl: string;
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
 * Derive the testimonial cards from a section node (pure — the same projection the website's
 * bespoke `TestimonialsSection` did, ported into the lib so `@sanad/web-ui` stays self-contained).
 * Cards come from the section's HYDRATED `testimonials` collection (`section.collection`, attached
 * in-service). The avatar is resolved **here** (server-side) via the injected `resolveImageUrl`, so
 * each card carries a plain `avatarUrl` string — any client wrapper then receives only serialisable
 * data (RSC-safe). Empty when the section links no testimonials.
 */
export function deriveTestimonialCards(
  section: SectionNode,
  locale: Locale,
  resolveImageUrl?: (imageMediaId: string) => string,
): TestimonialCardData[] {
  const items =
    section.collection?.collection === 'testimonials'
      ? section.collection.items
      : [];

  return items.map((item) => ({
    id: item.id,
    authorName: item.authorName,
    role: localizedOr(item.authorRole, locale),
    company: item.companyName ?? localizedOr(item.companyDescriptor, locale),
    quote: localizedOr(item.quote, locale),
    rating: Math.max(0, Math.min(5, Math.round(item.rating ?? 0))),
    avatarUrl: item.avatarMediaId
      ? (resolveImageUrl?.(item.avatarMediaId) ?? '')
      : '',
  }));
}
