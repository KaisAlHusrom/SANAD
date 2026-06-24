import type { BlogTagItem, LocalizedText } from '@sanad/contracts';
import type { BlogTagRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Assemble a blog tag with its `name` resolved to both locales (F7). */
export function assembleBlogTag(
  row: BlogTagRow,
  fields: Record<string, LocalizedText> | undefined,
): BlogTagItem {
  return {
    id: row.id,
    slug: row.slug,
    sortOrder: row.sortOrder,
    name: fields?.['name'] ?? EMPTY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
