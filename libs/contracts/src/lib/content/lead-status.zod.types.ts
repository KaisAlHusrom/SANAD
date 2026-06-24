import { z } from 'zod';

/** The admin inbox lifecycle of a lead: `new` → `contacted` → `archived`. Mirrors the DB enum. */
export const leadStatusSchema = z.enum(['new', 'contacted', 'archived']);

export type LeadStatus = z.infer<typeof leadStatusSchema>;
