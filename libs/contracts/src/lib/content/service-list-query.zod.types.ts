import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';
import { serviceCategorySchema } from './service-category.zod.types.js';

/**
 * The services list query. Extends the shared paginated/searchable list query (U17) with a
 * whitelisted `category` filter (N7). Strict so unknown query keys are rejected.
 * Runtime-validated → `.zod.types` (U16).
 */
export const serviceListQuerySchema = listQuerySchema
  .extend({
    category: serviceCategorySchema.optional(),
  })
  .strict();

export type ServiceListQuery = z.infer<typeof serviceListQuerySchema>;
