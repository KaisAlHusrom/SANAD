import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { slugSchema } from './content-slug.zod.types.js';

/**
 * Create a blog tag (admin, `content.manage`). A translatable lookup: `slug` (unique) + `name`
 * (required, both locales). Strict (N7); `.zod.types` (U16).
 */
export const blogTagCreateSchema = z
  .object({
    slug: slugSchema,
    sortOrder: z.number().int().min(0).default(0),
    name: localizedTextSchema,
  })
  .strict();

export type BlogTagCreateRequest = z.infer<typeof blogTagCreateSchema>;

/** Update a blog tag by id (admin). All fields optional (partial). Strict (N7). */
export const blogTagUpdateSchema = z
  .object({
    id: z.string().uuid(),
    slug: slugSchema.optional(),
    sortOrder: z.number().int().min(0).optional(),
    name: localizedTextSchema.optional(),
  })
  .strict();

export type BlogTagUpdateRequest = z.infer<typeof blogTagUpdateSchema>;
