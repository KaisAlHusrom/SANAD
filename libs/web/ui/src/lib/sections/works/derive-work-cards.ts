import {
  type Locale,
  type LocalizedText,
  pickLocalized,
  type SectionNode,
} from '@sanad/contracts';

/** A serialisable case-study card — the section's hydrated portfolio item, projected for the orbit. */
export interface WorkCardData {
  id: string;
  /** the case-study slug — the injected `WorkCardLink` localizes it to `/portfolio/<slug>`. */
  slug: string;
  title: string;
  /** the category name (the mono tag), blank when uncategorised. */
  tag: string;
  /** the client name, else the summary. */
  client: string;
  challenge: string;
  /** the metric token of the result ("−40%"), mono LTR; blank when the result has none. */
  resultValue: string;
  /** the result's words, or the whole result when no metric leads. */
  resultLabel: string;
  /** the cover CDN url — resolved server-side (so only PLAIN data crosses into the client orbit,
   *  never a function — RSC-safe); `''` when there is no cover or it doesn't resolve. */
  coverUrl: string;
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
 * Split a result string into a leading metric token + its words ("−40% delivery time" →
 * `{ value:'−40%', label:'delivery time' }`), so the card renders the number large + the words
 * beside it. Falls back to the whole string as the label when no metric leads. (Ported verbatim
 * from the website's `section-content.splitMetric` so the swap is a no-op — U3/U15.)
 */
export function splitMetric(result: string): { value: string; label: string } {
  const match = /^([+\-−±~]?[0-9٠-٩][0-9٠-٩.,]*[%٪x×+KMBkmb]?)\s+(\S.*)$/u.exec(
    result.trim(),
  );
  const value = match?.[1];
  const label = match?.[2];
  if (value !== undefined && label !== undefined) {
    return { value: value.trim(), label: label.trim() };
  }
  return { value: '', label: result.trim() };
}

/**
 * Derive the works orbit cards from a section node (pure — the same projection the website's
 * `WorksSection` did, ported into the lib so `@sanad/web-ui` stays self-contained). Cards come from
 * the section's HYDRATED `portfolio` collection (`section.collection`, attached in-service). The
 * cover is resolved **here** (server-side) via the injected `resolveImageUrl`, so each card carries a
 * plain `coverUrl` string — the client orbit then receives only serialisable data (RSC-safe: no
 * function crosses the server→client boundary). Empty when the section links no published projects.
 */
export function deriveWorkCards(
  section: SectionNode,
  locale: Locale,
  resolveImageUrl?: (imageMediaId: string) => string,
): WorkCardData[] {
  const items =
    section.collection?.collection === 'portfolio'
      ? section.collection.items
      : [];

  return items.map((project) => {
    const result = splitMetric(localizedOr(project.result, locale));
    return {
      id: project.id,
      slug: project.slug,
      title: localizedOr(project.title, locale),
      tag: project.category ? localizedOr(project.category.name, locale) : '',
      client: project.clientName ?? localizedOr(project.summary, locale),
      challenge:
        localizedOr(project.challenge, locale) ||
        localizedOr(project.summary, locale),
      resultValue: result.value,
      resultLabel: result.label,
      coverUrl: project.coverMediaId
        ? (resolveImageUrl?.(project.coverMediaId) ?? '')
        : '',
    };
  });
}
