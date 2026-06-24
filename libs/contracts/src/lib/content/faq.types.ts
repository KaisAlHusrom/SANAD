import type { LocalizedText } from '../common/localized-text.js';
import type { FaqCategory } from './faq-category.zod.types.js';

/**
 * An FAQ entry as the gateway returns it (WEB1). `category` is an optional grouping; the
 * translatable `question`/`answer` are carried in BOTH locales (`LocalizedText`, null-safe —
 * F7). No slug — FAQs are listed, not individually addressed. Pure shape (U16).
 */
export interface FaqItem {
  id: string;
  category: FaqCategory | null;
  sortOrder: number;
  question: LocalizedText;
  answer: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
