import { z } from 'zod';
import { booleanParamSchema } from '../common/boolean-param.js';
import { listQuerySchema } from '../common/list-query.js';
import { portfolioStatusSchema } from './portfolio-status.zod.types.js';

/**
 * The portfolio list query. Extends the shared paginated/searchable list (U17) with whitelisted
 * `categoryId`, `featured`, and `status` filters (N7). `search` matches the translatable
 * `title`/`summary` in either locale. The gateway PUBLIC route forces `status=published`; the
 * guarded admin route honors the supplied `status` (sees drafts). Strict; `.zod.types` (U16).
 */
export const portfolioListQuerySchema = listQuerySchema
  .extend({
    categoryId: z.string().uuid().optional(),
    featured: booleanParamSchema.optional(),
    status: portfolioStatusSchema.optional(),
  })
  .strict();

export type PortfolioListQuery = z.infer<typeof portfolioListQuerySchema>;
