import { describe, expect, it } from 'vitest';
import { moonOrbitPosition, type MoonDef } from './moon-orbit';
import {
  SHOOTING_STAR_DURATION,
  SHOOTING_STAR_PERIOD,
  shootingStar,
} from './shooting-star';
import { ringRocks } from './ring-rocks';

const MOON: MoonDef = {
  orbitRadius: 180,
  speed: 0.2,
  phase: 1.1,
  inclination: 0.35,
  size: 12,
};

describe('moonOrbitPosition (inclined circular orbit)', () => {
  it('stays on its orbit sphere (radius conserved)', () => {
    for (const t of [0, 3.7, 12, 60]) {
      const p = moonOrbitPosition(MOON, t, false);
      expect(Math.hypot(p.x, p.y, p.z)).toBeCloseTo(MOON.orbitRadius, 6);
    }
  });

  it('actually travels in full motion and freezes at its phase under reduced motion', () => {
    const a = moonOrbitPosition(MOON, 0, false);
    const b = moonOrbitPosition(MOON, 5, false);
    expect(Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z)).toBeGreaterThan(1);
    expect(moonOrbitPosition(MOON, 5, true)).toEqual(
      moonOrbitPosition(MOON, 0, true),
    );
  });

  it('inclines out of the ring plane (y is used)', () => {
    const p = moonOrbitPosition({ ...MOON, phase: Math.PI / 2 }, 0, true);
    expect(Math.abs(p.y)).toBeGreaterThan(1);
  });
});

// NOTE: a `nebulaField` per-world deep-sky module briefly lived here (8.B-4 Stage 2c) and was
// REMOVED (owner, 2026-07-07): even sub-bloom-threshold additive sprites ADD light directly, and
// dozens of them mottled deep space grey-green. Deep space stays reference-black — no ambient
// additive set dressing behind the star field.

describe('shootingStar (rare streak)', () => {
  it('is dark under reduced motion and outside the streak window', () => {
    expect(shootingStar(SHOOTING_STAR_PERIOD * 0.5, true).active).toBe(false);
    // mid-cycle, long after the streak has finished
    expect(shootingStar(SHOOTING_STAR_PERIOD * 0.6, false).active).toBe(false);
  });

  it('streaks with a rise-and-fade envelope early in each cycle', () => {
    const mid = shootingStar(SHOOTING_STAR_DURATION * 0.5, false);
    expect(mid.active).toBe(true);
    expect(mid.opacity).toBeGreaterThan(0.5);
    const late = shootingStar(SHOOTING_STAR_DURATION * 0.97, false);
    expect(late.opacity).toBeLessThan(mid.opacity);
  });

  it('travels across the field within a streak and re-routes between cycles', () => {
    const a = shootingStar(SHOOTING_STAR_DURATION * 0.1, false);
    const b = shootingStar(SHOOTING_STAR_DURATION * 0.9, false);
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeGreaterThan(100);
    const nextCycle = shootingStar(
      SHOOTING_STAR_PERIOD + SHOOTING_STAR_DURATION * 0.1,
      false,
    );
    expect(nextCycle.angle).not.toBeCloseTo(a.angle, 3);
  });
});

describe('ringRocks (instanced belt)', () => {
  it('scatters deterministic rocks inside the annulus', () => {
    const rocks = ringRocks(90, 100, 180);
    expect(rocks).toHaveLength(90);
    expect(ringRocks(90, 100, 180)).toEqual(rocks);
    for (const r of rocks) {
      const radius = Math.hypot(r.x, r.y);
      expect(radius).toBeGreaterThanOrEqual(100);
      expect(radius).toBeLessThanOrEqual(180);
      expect(r.scale).toBeGreaterThan(0);
    }
  });

  it('spreads rocks around the whole ring (no clumped arc)', () => {
    const rocks = ringRocks(120, 100, 180);
    const quadrants = [0, 0, 0, 0];
    for (const r of rocks) {
      const a = Math.atan2(r.y, r.x);
      quadrants[a < 0 ? (a < -Math.PI / 2 ? 2 : 3) : a > Math.PI / 2 ? 1 : 0] +=
        1;
    }
    for (const q of quadrants) expect(q).toBeGreaterThan(10);
  });
});
