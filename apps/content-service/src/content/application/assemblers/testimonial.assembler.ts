import type { LocalizedText, TestimonialItem } from '@sanad/contracts';
import type { TestimonialRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Assemble a testimonial with its translatable copy resolved to both locales (F7). */
export function assembleTestimonial(
  row: TestimonialRow,
  fields: Record<string, LocalizedText> | undefined,
): TestimonialItem {
  return {
    id: row.id,
    authorName: row.authorName,
    companyName: row.companyName,
    avatarMediaId: row.avatarMediaId,
    rating: row.rating,
    featured: row.featured,
    sortOrder: row.sortOrder,
    quote: fields?.['quote'] ?? EMPTY,
    authorRole: fields?.['authorRole'] ?? EMPTY,
    companyDescriptor: fields?.['companyDescriptor'] ?? EMPTY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
