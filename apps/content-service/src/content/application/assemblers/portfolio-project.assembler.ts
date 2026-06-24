import type {
  LocalizedText,
  PortfolioCategoryRef,
  PortfolioProjectItem,
} from '@sanad/contracts';
import type { PortfolioProjectRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/**
 * Assemble a portfolio project with its translatable copy resolved to both locales (F7) and its
 * category embedded (embed-on-read) — `null` when uncategorized.
 */
export function assemblePortfolioProject(
  row: PortfolioProjectRow,
  fields: Record<string, LocalizedText> | undefined,
  category: PortfolioCategoryRef | null,
): PortfolioProjectItem {
  return {
    id: row.id,
    slug: row.slug,
    category,
    coverMediaId: row.coverMediaId,
    clientName: row.clientName,
    projectUrl: row.projectUrl,
    status: row.status,
    publishedAt: row.publishedAt ? row.publishedAt.toISOString() : null,
    featured: row.featured,
    sortOrder: row.sortOrder,
    title: fields?.['title'] ?? EMPTY,
    summary: fields?.['summary'] ?? EMPTY,
    challenge: fields?.['challenge'] ?? EMPTY,
    solution: fields?.['solution'] ?? EMPTY,
    result: fields?.['result'] ?? EMPTY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
