import { describe, expect, it } from 'vitest';
import { LEAD_SPAM_BANDS, LEAD_SPAM_SCORE_MAX } from '../lead-spam-bands.js';
import { leadSpamVerdictSchema } from '../lead-spam-verdict.zod.types.js';
import { spamVerdictOf } from './spam-verdict-of.js';

describe('spamVerdictOf (P8.10.B3)', () => {
  it('reads a never-scored lead as clean', () => {
    expect(spamVerdictOf(0)).toBe('clean');
  });

  it('places every band boundary on the right side', () => {
    expect(spamVerdictOf(LEAD_SPAM_BANDS.clean.max)).toBe('clean');
    expect(spamVerdictOf(LEAD_SPAM_BANDS.suspicious.min)).toBe('suspicious');
    expect(spamVerdictOf(LEAD_SPAM_BANDS.suspicious.max)).toBe('suspicious');
    expect(spamVerdictOf(LEAD_SPAM_BANDS.likelySpam.min)).toBe('likelySpam');
    expect(spamVerdictOf(LEAD_SPAM_SCORE_MAX)).toBe('likelySpam');
  });

  it('covers the whole 0..max range with no gap and no overlap', () => {
    // The bands are the ONE table the badge tone and the DB filter both read (U3) — a gap
    // would make a lead unreachable by every filter, an overlap would double-count it.
    for (let score = 0; score <= LEAD_SPAM_SCORE_MAX; score += 1) {
      const matching = Object.entries(LEAD_SPAM_BANDS).filter(
        ([, band]) => score >= band.min && score <= band.max,
      );
      expect(matching).toHaveLength(1);
      expect(matching[0]?.[0]).toBe(spamVerdictOf(score));
    }
  });

  it('clamps a score from outside the range instead of falling through', () => {
    expect(spamVerdictOf(-10)).toBe('clean');
    expect(spamVerdictOf(LEAD_SPAM_SCORE_MAX + 500)).toBe('likelySpam');
  });

  it('declares a band for every verdict the schema accepts', () => {
    expect(Object.keys(LEAD_SPAM_BANDS).sort()).toEqual(
      [...leadSpamVerdictSchema.options].sort(),
    );
  });
});
