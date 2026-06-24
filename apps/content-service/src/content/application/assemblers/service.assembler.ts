import type { LocalizedText, ServiceItem } from '@sanad/contracts';
import type { ServiceRow } from '../../../db/schema/index.js';

const EMPTY: LocalizedText = { ar: '', en: '' };

/** Assemble a service item with its translatable copy resolved to both locales (F7). */
export function assembleService(
  row: ServiceRow,
  fields: Record<string, LocalizedText> | undefined,
): ServiceItem {
  return {
    id: row.id,
    slug: row.slug,
    iconKey: row.iconKey,
    category: row.category,
    coverMediaId: row.coverMediaId,
    sortOrder: row.sortOrder,
    title: fields?.['title'] ?? EMPTY,
    summary: fields?.['summary'] ?? EMPTY,
    detailBody: fields?.['detailBody'] ?? EMPTY,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
