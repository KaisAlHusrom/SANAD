import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';
import { faqCategorySchema } from './faq-category.zod.types.js';

/**
 * The FAQ list query. Extends the shared paginated/searchable list query (U17) with a
 * whitelisted `category` filter (N7). `search` matches the translatable `question`/`answer`
 * in either locale. Strict; `.zod.types` (U16).
 */
export const faqListQuerySchema = listQuerySchema
  .extend({
    category: faqCategorySchema.optional(),
  })
  .strict();

export type FaqListQuery = z.infer<typeof faqListQuerySchema>;
