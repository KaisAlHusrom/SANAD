import { z } from 'zod';

/**
 * How a lead's spam score reads to a human (P8.10.B3). Advisory only — a verdict ranks a lead
 * in the inbox, it never rejects, archives or hides one.
 *
 * Derived from the score via `spamVerdictOf`, never stored: keeping it out of the row means a
 * change to the bands reclassifies every lead consistently instead of freezing yesterday's
 * judgement into a column.
 */
export const leadSpamVerdictSchema = z.enum([
  'clean',
  'suspicious',
  'likelySpam',
]);

export type LeadSpamVerdict = z.infer<typeof leadSpamVerdictSchema>;
