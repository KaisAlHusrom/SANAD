import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';

/**
 * The blog-categories list query — the shared paginated/searchable list (U17). `search` matches
 * the translatable `name`/`description` in either locale. Strict; `.zod.types` (U16).
 */
export const blogCategoryListQuerySchema = listQuerySchema.strict();

export type BlogCategoryListQuery = z.infer<typeof blogCategoryListQuerySchema>;
