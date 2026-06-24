import { z } from 'zod';
import { booleanParamSchema } from '../common/boolean-param.js';
import { listQuerySchema } from '../common/list-query.js';

/**
 * The testimonials list query. Extends the shared paginated/searchable list query (U17) with a
 * whitelisted `featured` filter (N7) so the website can pull the curated landing set. `search`
 * matches the translatable `quote`/`authorRole` in either locale. Strict; `.zod.types` (U16).
 */
export const testimonialListQuerySchema = listQuerySchema
  .extend({
    featured: booleanParamSchema.optional(),
  })
  .strict();

export type TestimonialListQuery = z.infer<typeof testimonialListQuerySchema>;
