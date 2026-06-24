import type { FaqItem, LocalizedText } from '@sanad/contracts';
import type { FaqRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Assemble an FAQ with its translatable copy resolved to both locales (F7). */
export function assembleFaq(
  row: FaqRow,
  fields: Record<string, LocalizedText> | undefined,
): FaqItem {
  return {
    id: row.id,
    category: row.category,
    sortOrder: row.sortOrder,
    question: fields?.['question'] ?? EMPTY,
    answer: fields?.['answer'] ?? EMPTY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
