import { LEAD_SPAM_BANDS, LEAD_SPAM_SCORE_MAX } from '../lead-spam-bands.js';
import type { LeadSpamVerdict } from '../lead-spam-verdict.zod.types.js';

/**
 * Read a stored spam score as a verdict (P8.10.B3). The single place the bands are applied, so
 * the inbox badge and the repository's score-range filter can never disagree (U3).
 *
 * Clamps rather than falling through: a score from an older weight table must still land in a
 * band, because "no verdict" would render as an empty cell that looks identical to `clean`.
 */
export function spamVerdictOf(score: number): LeadSpamVerdict {
  const clamped = Math.min(Math.max(score, 0), LEAD_SPAM_SCORE_MAX);
  return clamped >= LEAD_SPAM_BANDS.likelySpam.min
    ? 'likelySpam'
    : clamped >= LEAD_SPAM_BANDS.suspicious.min
      ? 'suspicious'
      : 'clean';
}
