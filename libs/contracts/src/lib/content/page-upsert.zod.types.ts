import { z } from 'zod';
import { localizedTextSchema } from '../common/localized-text.js';
import { pageStatusSchema } from './page-status.zod.types.js';
import { slugSchema } from './content-slug.zod.types.js';

/**
 * Create-or-update a page's meta (admin, `content.manage`). An `id` present → update; absent
 * → create (keyed by unique `slug`). Sections/blocks are upserted via their own patterns.
 * Translatable copy is supplied in BOTH locales (`LocalizedText`); SEO fields are optional.
 * Strict (N7); runtime-validated → `.zod.types` (U16).
 */
export const pageUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    slug: slugSchema,
    status: pageStatusSchema.default('published'),
    sortOrder: z.number().int().min(0).default(0),
    title: localizedTextSchema,
    metaTitle: localizedTextSchema.optional(),
    metaDescription: localizedTextSchema.optional(),
  })
  .strict();

export type PageUpsertRequest = z.infer<typeof pageUpsertSchema>;
