import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';

/**
 * The portfolio-categories list query — the shared paginated/searchable list (U17). `search`
 * matches the translatable `name` in either locale. Strict; `.zod.types` (U16).
 */
export const portfolioCategoryListQuerySchema = listQuerySchema.strict();

export type PortfolioCategoryListQuery = z.infer<
  typeof portfolioCategoryListQuerySchema
>;
