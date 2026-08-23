import type { LeadSpamVerdict } from './lead-spam-verdict.zod.types.js';

/** Scores are a clamped 0..100 sum of the fired signals' weights. */
export const LEAD_SPAM_SCORE_MAX = 100;

/**
 * Score → verdict, inclusive on both ends (P8.10.B3). The bands must tile 0..MAX with no gap and
 * no overlap — a gap makes a lead unreachable by every inbox filter.
 *
 * They live in contracts because two projects read the SAME table (U3): the admin derives the
 * badge tone from it, and content-service turns an inbox `?spam=` filter into the score range it
 * queries. Coded, not settings-resolved (unlike the P8.10.B2 dedup window) — a campaign window is
 * a policy an operator tunes mid-flight, detection tuning ships with the code that does it.
 *
 * Deliberately forgiving at the bottom: a real enquiry carrying one portfolio link must stay
 * `clean`. The expensive failure here is a false positive, not a missed bot.
 */
export const LEAD_SPAM_BANDS: Readonly<
  Record<LeadSpamVerdict, { readonly min: number; readonly max: number }>
> = {
  clean: { min: 0, max: 24 },
  suspicious: { min: 25, max: 59 },
  likelySpam: { min: 60, max: LEAD_SPAM_SCORE_MAX },
};
