import type { LocalizedText } from '../common/localized-text.js';

/**
 * A client testimonial as the gateway returns it (WEB1). `authorName`/`companyName` are
 * proper nouns (non-translatable); the translatable `quote`/`authorRole`/`companyDescriptor`
 * are carried in BOTH locales (`LocalizedText`, null-safe — F7). `avatarMediaId` is a soft
 * media reference (NOT a cross-service FK, MS5). Pure shape (U16).
 */
export interface TestimonialItem {
  id: string;
  authorName: string;
  companyName: string | null;
  avatarMediaId: string | null;
  rating: number | null;
  featured: boolean;
  sortOrder: number;
  quote: LocalizedText;
  authorRole: LocalizedText;
  companyDescriptor: LocalizedText;
  createdAt: string;
  updatedAt: string;
}
