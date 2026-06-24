import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';
import { leadSourceSchema } from './lead-source.zod.types.js';
import { leadStatusSchema } from './lead-status.zod.types.js';

/**
 * The admin leads-inbox query (GET /api/leads, `content.manage`). Extends the shared list
 * query (U17) with whitelisted `status` + `source` filters (N7). `search` matches name/
 * email/company. Strict; `.zod.types` (U16).
 */
export const leadListQuerySchema = listQuerySchema
  .extend({
    status: leadStatusSchema.optional(),
    source: leadSourceSchema.optional(),
  })
  .strict();

export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
