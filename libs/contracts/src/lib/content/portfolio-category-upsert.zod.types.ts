import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { slugSchema } from './content-slug.zod.types.js';

/**
 * Create a portfolio category (admin, `content.manage`). A translatable lookup: `slug` (unique)
 * + `name` in BOTH locales. Strict (N7); `.zod.types` (U16).
 */
export const portfolioCategoryCreateSchema = z
  .object({
    slug: slugSchema,
    sortOrder: z.number().int().min(0).default(0),
    name: localizedTextSchema,
  })
  .strict();

export type PortfolioCategoryCreateRequest = z.infer<
  typeof portfolioCategoryCreateSchema
>;

/** Update a portfolio category by id (admin). All fields optional (partial). Strict (N7). */
export const portfolioCategoryUpdateSchema = z
  .object({
    id: z.string().uuid(),
    slug: slugSchema.optional(),
    sortOrder: z.number().int().min(0).optional(),
    name: localizedTextSchema.optional(),
  })
  .strict();

export type PortfolioCategoryUpdateRequest = z.infer<
  typeof portfolioCategoryUpdateSchema
>;
