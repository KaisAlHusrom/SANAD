import type { BlogCategoryItem, LocalizedText } from '@sanad/contracts';
import type { BlogCategoryRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Assemble a blog category with its translatable copy resolved to both locales (F7). */
export function assembleBlogCategory(
  row: BlogCategoryRow,
  fields: Record<string, LocalizedText> | undefined,
): BlogCategoryItem {
  return {
    id: row.id,
    slug: row.slug,
    sortOrder: row.sortOrder,
    name: fields?.['name'] ?? EMPTY,
    description: fields?.['description'] ?? EMPTY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
