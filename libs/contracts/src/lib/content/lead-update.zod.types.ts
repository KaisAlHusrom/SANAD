import { z } from 'zod';
import { leadStatusSchema } from './lead-status.zod.types.js';

/**
 * Update a lead's inbox status (admin, `content.manage`). Strict (N7); `.zod.types` (U16).
 */
export const leadUpdateSchema = z
  .object({
    id: z.string().uuid(),
    status: leadStatusSchema,
  })
  .strict();

export type LeadUpdateRequest = z.infer<typeof leadUpdateSchema>;
