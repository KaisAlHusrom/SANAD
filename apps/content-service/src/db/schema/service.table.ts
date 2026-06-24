import { index, integer, pgTable, text, uuid } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';
import { serviceCategoryEnum } from './enums.js';

/**
 * A service/capability the company offers (N4). `slug` is the unique detail-page key;
 * `category` groups core vs supporting capabilities (WEB1). `coverMediaId` is a SOFT media
 * reference (nullable, NOT a cross-service FK, MS5). Translatable title/summary/detailBody
 * live in `service_translation` (N5).
 */
export const serviceTable = pgTable(
  'service',
  {
    id: pk(),
    slug: text('slug').notNull().unique(),
    iconKey: text('icon_key'),
    category: serviceCategoryEnum('category').notNull(),
    coverMediaId: uuid('cover_media_id'),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('service_category_idx').on(table.category),
    index('service_cover_media_idx').on(table.coverMediaId),
  ],
);

export type ServiceRow = typeof serviceTable.$inferSelect;
