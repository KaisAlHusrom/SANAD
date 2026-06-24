import { z } from 'zod';
import { booleanParamSchema } from '../common/boolean-param.js';
import { listQuerySchema } from '../common/list-query.js';

/**
 * The team-members list query. Extends the shared paginated/searchable list query (U17) with a
 * whitelisted `featured` filter (N7) for the curated About set. `search` matches the
 * translatable `name`/`role` in either locale. Strict; `.zod.types` (U16).
 */
export const teamMemberListQuerySchema = listQuerySchema
  .extend({
    featured: booleanParamSchema.optional(),
  })
  .strict();

export type TeamMemberListQuery = z.infer<typeof teamMemberListQuerySchema>;
