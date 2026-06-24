import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { serviceCategorySchema } from './service-category.zod.types.js';
import { slugSchema } from './content-slug.zod.types.js';

/**
 * Create a service (admin, `content.manage`). Translatable copy is supplied in BOTH locales;
 * `summary`/`detailBody` are optional. `coverMediaId` is a soft media reference (MS5).
 * Strict (N7); `.zod.types` (U16).
 */
export const serviceCreateSchema = z
  .object({
    slug: slugSchema,
    category: serviceCategorySchema,
    iconKey: z.string().trim().min(1).max(64).nullable().optional(),
    coverMediaId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().min(0).default(0),
    title: localizedTextSchema,
    summary: localizedTextSchema.optional(),
    detailBody: localizedTextSchema.optional(),
  })
  .strict();

export type ServiceCreateRequest = z.infer<typeof serviceCreateSchema>;

/**
 * Update a service by id (admin). All fields optional (partial); translatable fields, when
 * present, carry both locales. Strict (N7).
 */
export const serviceUpdateSchema = z
  .object({
    id: z.string().uuid(),
    slug: slugSchema.optional(),
    category: serviceCategorySchema.optional(),
    iconKey: z.string().trim().min(1).max(64).nullable().optional(),
    coverMediaId: z.string().uuid().nullable().optional(),
    sortOrder: z.number().int().min(0).optional(),
    title: localizedTextSchema.optional(),
    summary: localizedTextSchema.optional(),
    detailBody: localizedTextSchema.optional(),
  })
  .strict();

export type ServiceUpdateRequest = z.infer<typeof serviceUpdateSchema>;
