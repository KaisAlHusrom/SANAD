import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';

/**
 * The blog-tags list query — the shared paginated/searchable list (U17). `search` matches the
 * translatable `name` in either locale. Strict; `.zod.types` (U16).
 */
export const blogTagListQuerySchema = listQuerySchema.strict();

export type BlogTagListQuery = z.infer<typeof blogTagListQuerySchema>;
