import { describe, expect, it } from 'vitest';
import {
  blastFlash,
  blastShake,
  debrisWave,
  earthApproachArc,
  earthHaloOpacity,
  finaleDim,
  finaleTimeline,
} from './finale';

describe('finaleTimeline (comet → Earth → footer)', () => {
  it('approaches with the Earth far and no blast in the first half', () => {
    const start = finaleTimeline(0.05);
    const preImpact = finaleTimeline(0.49);
    expect(start.blast).toBe(false);
    expect(preImpact.blast).toBe(false);
    // the Earth is nearer at the end of the approach than at the start
    expect(preImpact.dist).toBeLessThan(start.dist);
    expect(preImpact.scale).toBeGreaterThan(start.scale);
  });

  it('strikes at the midpoint and dissolves into the footer at the end', () => {
    expect(finaleTimeline(0.5).blast).toBe(true);
    expect(finaleTimeline(0.95).finOut).toBeLessThan(0.05); // scene gone, footer owns the screen
    expect(finaleTimeline(0.3).finOut).toBeCloseTo(1, 5); // still fully present pre-impact
  });

  it('flashes hardest right at the strike and decays', () => {
    expect(blastFlash(0)).toBeCloseTo(1, 5);
    expect(blastFlash(0.5)).toBeLessThan(blastFlash(0.2));
    expect(blastFlash(1)).toBeLessThan(0.001);
  });
});

describe('finaleDim (post-0.62 dissolve multiplier)', () => {
  it('is 1 before 0.62 (no dimming) and finOut after', () => {
    expect(finaleDim(0.5, 0.8)).toBe(1);
    expect(finaleDim(0.62, 0.8)).toBe(1); // boundary is exclusive
    expect(finaleDim(0.7, 0.4)).toBe(0.4);
    expect(finaleDim(0.95, 0)).toBe(0);
  });
});

describe('earthHaloOpacity (blast-boosted halo)', () => {
  it('has no blast term before impact', () => {
    // a=1, earthVis=1, not blasting → 0.22 + 0.4
    expect(earthHaloOpacity(1, 0, false, 1)).toBeCloseTo(0.62, 6);
  });
  it('spikes at the strike then eases back down as ex grows', () => {
    const atStrike = earthHaloOpacity(1, 0, true, 1); // full blast boost 0.4
    const later = earthHaloOpacity(1, 0.8, true, 1);
    expect(atStrike).toBeCloseTo(0.62 + 0.4, 6);
    expect(later).toBeLessThan(atStrike);
  });
  it('scales the whole thing by earthVis (dissolves with the scene)', () => {
    expect(earthHaloOpacity(1, 0, false, 0)).toBe(0);
    expect(earthHaloOpacity(1, 0, false, 0.5)).toBeCloseTo(0.31, 6);
  });
});

describe('blastShake (camera jitter amplitude)', () => {
  it('is strongest at the strike and decays to nothing', () => {
    expect(blastShake(0)).toBeCloseTo(18, 6);
    expect(blastShake(1)).toBeLessThan(blastShake(0));
    expect(blastShake(3)).toBeLessThan(0.5); // essentially still by the end
  });
});

describe('earthApproachArc (lateral swing-in)', () => {
  it('is zero at both ends and peaks mid-approach', () => {
    expect(earthApproachArc(0)).toBeCloseTo(0, 6);
    expect(earthApproachArc(1)).toBeCloseTo(0, 6);
    expect(earthApproachArc(0.5)).toBeCloseTo(120, 6);
  });
});

describe('debrisWave (second, warm shock ring)', () => {
  it('rises after the primary shock and saturates late', () => {
    expect(debrisWave(0)).toBeCloseTo(0, 6);
    expect(debrisWave(0.15)).toBeCloseTo(0, 6);
    expect(debrisWave(1.3)).toBeCloseTo(1, 6);
    expect(debrisWave(0.7)).toBeGreaterThan(0);
    expect(debrisWave(0.7)).toBeLessThan(1);
  });
});
