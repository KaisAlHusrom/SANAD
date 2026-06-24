import type { LocalizedText, PortfolioCategoryItem } from '@sanad/contracts';
import type { PortfolioCategoryRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Assemble a portfolio category with its `name` resolved to both locales (F7). */
export function assemblePortfolioCategory(
  row: PortfolioCategoryRow,
  fields: Record<string, LocalizedText> | undefined,
): PortfolioCategoryItem {
  return {
    id: row.id,
    slug: row.slug,
    sortOrder: row.sortOrder,
    name: fields?.['name'] ?? EMPTY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
