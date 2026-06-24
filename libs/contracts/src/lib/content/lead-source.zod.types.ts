import { z } from 'zod';

/** Where a lead came from: the simple `contact` form vs the multi-step `request-project` form. */
export const leadSourceSchema = z.enum(['contact', 'request-project']);

export type LeadSource = z.infer<typeof leadSourceSchema>;
