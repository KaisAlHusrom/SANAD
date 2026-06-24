import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';
import { blogPostStatusSchema } from './blog-post-status.zod.types.js';

/**
 * The blog-posts list query. Extends the shared paginated/searchable list (U17) with whitelisted
 * `categoryId` + `status` filters (N7). `search` matches the translatable `title`/`excerpt` in
 * either locale. The gateway PUBLIC route forces `status=published`; the guarded admin route
 * honors the supplied `status` (sees drafts). Strict; `.zod.types` (U16).
 */
export const blogPostListQuerySchema = listQuerySchema
  .extend({
    categoryId: z.string().uuid().optional(),
    status: blogPostStatusSchema.optional(),
  })
  .strict();

export type BlogPostListQuery = z.infer<typeof blogPostListQuerySchema>;
