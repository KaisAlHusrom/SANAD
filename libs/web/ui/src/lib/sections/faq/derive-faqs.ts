import { type Locale, pickLocalized, type SectionNode } from '@sanad/contracts';
import { FAQ_CATEGORY_LABEL } from './faq-copy.js';

/** A serialisable FAQ row — the section's hydrated FAQ, projected + localized for the accordion. */
export interface FaqRowData {
  id: string;
  /** the question in the active locale. */
  question: string;
  /** the answer in the active locale (trusted plain text). */
  answer: string;
  /** the localized category tag, else `''` when the FAQ has no category. */
  category: string;
}

/**
 * Derive the accordion rows from a section node (pure). Rows come from the section's HYDRATED `faq`
 * collection (`section.collection`, attached in-service). Copy is resolved to the active locale HERE
 * (server-side) so the client accordion receives only plain strings (RSC-safe — no `LocalizedText`,
 * no `pickLocalized` on the client). Empty when the section links no FAQs.
 */
export function deriveFaqRows(
  section: SectionNode,
  locale: Locale,
): FaqRowData[] {
  const items =
    section.collection?.collection === 'faq' ? section.collection.items : [];

  return items.map((item) => ({
    id: item.id,
    question: pickLocalized(item.question, locale),
    answer: pickLocalized(item.answer, locale),
    category: item.category
      ? pickLocalized(FAQ_CATEGORY_LABEL[item.category], locale)
      : '',
  }));
}
