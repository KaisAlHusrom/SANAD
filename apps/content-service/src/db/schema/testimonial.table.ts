import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  uuid,
} from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from '@sanad/database';

/**
 * A client testimonial (N4). `authorName`/`companyName` are proper nouns (non-translatable);
 * `rating` is an optional 1–5 score; `featured` curates the landing set; `avatarMediaId` is a
 * SOFT media reference (nullable, NOT a cross-service FK, MS5). Translatable quote/authorRole/
 * companyDescriptor live in `testimonial_translation` (N5). No status — soft-delete unpublishes.
 */
export const testimonialTable = pgTable(
  'testimonial',
  {
    id: pk(),
    authorName: text('author_name').notNull(),
    companyName: text('company_name'),
    avatarMediaId: uuid('avatar_media_id'),
    rating: integer('rating'),
    featured: boolean('featured').notNull().default(false),
    sortOrder: integer('sort_order').notNull().default(0),
    ...timestamps(),
    ...softDelete(),
  },
  (table) => [
    index('testimonial_featured_idx').on(table.featured, table.sortOrder),
    index('testimonial_avatar_media_idx').on(table.avatarMediaId),
  ],
);

export type TestimonialRow = typeof testimonialTable.$inferSelect;
