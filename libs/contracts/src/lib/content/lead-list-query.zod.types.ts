import { z } from 'zod';
import { listQuerySchema } from '../common/list-query.js';
import { leadSourceSchema } from './lead-source.zod.types.js';
import { leadSpamVerdictSchema } from './lead-spam-verdict.zod.types.js';
import { leadStatusSchema } from './lead-status.zod.types.js';

/**
 * The admin leads-inbox query (GET /api/leads, `content.manage`). Extends the shared list
 * query (U17) with whitelisted `status` + `source` + `spam` filters (N7). `search` matches
 * name/email/phone/company. Strict; `.zod.types` (U16).
 *
 * `spam` is the VERDICT, not a raw score: the repository turns it into the band's score range,
 * so the URL stays readable and the caller never has to know the thresholds (P8.10.B3).
 */
export const leadListQuerySchema = listQuerySchema
  .extend({
    status: leadStatusSchema.optional(),
    source: leadSourceSchema.optional(),
    spam: leadSpamVerdictSchema.optional(),
  })
  .strict();

export type LeadListQuery = z.infer<typeof leadListQuerySchema>;
