import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { slugSchema } from './content-slug.zod.types.js';

/**
 * Create a blog category (admin, `content.manage`). A translatable lookup: `slug` (unique) +
 * `name` (required, both locales) + optional `description`. Strict (N7); `.zod.types` (U16).
 */
export const blogCategoryCreateSchema = z
  .object({
    slug: slugSchema,
    sortOrder: z.number().int().min(0).default(0),
    name: localizedTextSchema,
    description: localizedTextSchema.optional(),
  })
  .strict();

export type BlogCategoryCreateRequest = z.infer<
  typeof blogCategoryCreateSchema
>;

/** Update a blog category by id (admin). All fields optional (partial). Strict (N7). */
export const blogCategoryUpdateSchema = z
  .object({
    id: z.string().uuid(),
    slug: slugSchema.optional(),
    sortOrder: z.number().int().min(0).optional(),
    name: localizedTextSchema.optional(),
    description: localizedTextSchema.optional(),
  })
  .strict();

export type BlogCategoryUpdateRequest = z.infer<
  typeof blogCategoryUpdateSchema
>;
