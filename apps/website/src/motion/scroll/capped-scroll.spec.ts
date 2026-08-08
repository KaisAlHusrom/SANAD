import { describe, expect, it } from 'vitest';
import {
  clampScrollTarget,
  keyScrollDelta,
  normalizeWheelDelta,
  scrollLead,
  stepCappedScroll,
} from './capped-scroll';

/**
 * The speed-capped scroll math (WS4 — constant-speed catch-up). Ported from the reference
 * `updateSmoothScroll`/`setupSmoothScroll`: the real scroll advances toward a target at a hard
 * px/second ceiling, so a violent flick can never outrun the reading pace, yet a small scroll still
 * settles quickly. Pure + frame-rate independent (dt in seconds, no wall-clock).
 */
describe('stepCappedScroll', () => {
  const MAX = 1000; // px/s (balanced)

  it('caps the advance at maxSpeed·dt when the target is far away', () => {
    // current 0 → target 10000 in one 60fps frame can move at most 1000/60 px
    const next = stepCappedScroll(0, 10000, 1 / 60, MAX);
    expect(next).toBeCloseTo(1000 / 60, 6);
  });

  it('is symmetric for a negative diff (scrolling up)', () => {
    const next = stepCappedScroll(10000, 0, 1 / 60, MAX);
    expect(next).toBeCloseTo(10000 - 1000 / 60, 6);
  });

  it('is frame-rate independent — two 8ms steps ≈ one 16ms step (within 1%)', () => {
    const oneBig = stepCappedScroll(0, 10000, 0.016, MAX);
    const first = stepCappedScroll(0, 10000, 0.008, MAX);
    const twoSmall = stepCappedScroll(first, 10000, 0.008, MAX);
    // both are cap-bound here (far target): 0.016·1000 vs 2·0.008·1000 — equal
    expect(twoSmall).toBeCloseTo(oneBig, 5);
  });

  it('eases out near the target without overshooting (monotone approach)', () => {
    let cur = 0;
    const target = 50; // close enough that the ease-out, not the cap, governs
    const seen: number[] = [];
    for (let i = 0; i < 40; i += 1) {
      const next = stepCappedScroll(cur, target, 1 / 60, MAX);
      // never crosses the target
      expect(next).toBeLessThanOrEqual(target + 1e-6);
      expect(next).toBeGreaterThanOrEqual(cur - 1e-6); // monotone increasing
      cur = next;
      seen.push(cur);
    }
    // and it actually converges to the target
    expect(cur).toBeCloseTo(target, 1);
  });

  it('snaps to the target when the remaining distance is under 0.4px', () => {
    expect(stepCappedScroll(99.7, 100, 1 / 60, MAX)).toBe(100);
    expect(stepCappedScroll(100.3, 100, 1 / 60, MAX)).toBe(100);
  });
});

describe('scrollLead', () => {
  it('is 14% of maxSpeed with a 90px floor', () => {
    expect(scrollLead(1000)).toBe(140);
    expect(scrollLead(400)).toBe(90); // floor wins (0.14·400 = 56)
  });
});

describe('clampScrollTarget', () => {
  it('never lets the target bank more than one lead-step ahead of current', () => {
    // current 500, lead 140, a huge wheel push to 5000 → clamped to 640
    expect(clampScrollTarget(5000, 500, 140, 10000)).toBe(640);
    // upward push clamps to current − lead
    expect(clampScrollTarget(-5000, 500, 140, 10000)).toBe(360);
  });

  it('clamps to the scrollable range [0, maxY] after the lead clamp', () => {
    expect(clampScrollTarget(80, 60, 140, 10000)).toBe(80); // within lead + range
    expect(clampScrollTarget(-40, 60, 140, 10000)).toBe(0); // below 0
    expect(clampScrollTarget(10080, 9950, 140, 10000)).toBe(10000); // within lead but past maxY
  });
});

describe('normalizeWheelDelta', () => {
  const VH = 800;
  it('passes pixel deltas through (deltaMode 0)', () => {
    expect(normalizeWheelDelta(120, 0, VH)).toBe(120);
  });
  it('scales line deltas by 32 (deltaMode 1)', () => {
    expect(normalizeWheelDelta(3, 1, VH)).toBe(96);
  });
  it('scales page deltas by the viewport height (deltaMode 2)', () => {
    expect(normalizeWheelDelta(1, 2, VH)).toBe(VH);
  });
});

describe('keyScrollDelta', () => {
  const VH = 800;
  it('maps arrows to ±90 and page/space to ±0.82vh', () => {
    expect(keyScrollDelta('ArrowDown', VH)).toBe(90);
    expect(keyScrollDelta('ArrowUp', VH)).toBe(-90);
    expect(keyScrollDelta('PageDown', VH)).toBeCloseTo(VH * 0.82, 6);
    expect(keyScrollDelta(' ', VH)).toBeCloseTo(VH * 0.82, 6);
    expect(keyScrollDelta('PageUp', VH)).toBeCloseTo(-VH * 0.82, 6);
  });
  it('returns null for keys it does not handle', () => {
    expect(keyScrollDelta('a', VH)).toBeNull();
    expect(keyScrollDelta('Enter', VH)).toBeNull();
  });
});
