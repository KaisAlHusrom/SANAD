import { describe, expect, it } from 'vitest';
import {
  PROMINENCE_PERIOD,
  atmosphereIntensity,
  gasFlowTime,
  prominenceState,
  starRayRotation,
} from './planet-life';

describe('gasFlowTime (living gas surfaces)', () => {
  it('passes the clock through in full motion', () => {
    expect(gasFlowTime(0, false)).toBe(0);
    expect(gasFlowTime(12.5, false)).toBe(12.5);
  });

  it('freezes the surface under reduced motion (calm mode, WEB4)', () => {
    expect(gasFlowTime(12.5, true)).toBe(0);
    expect(gasFlowTime(9999, true)).toBe(0);
  });
});

describe('atmosphereIntensity (fresnel limb)', () => {
  it('glimmers faintly when the world is away and fully lights at dock', () => {
    expect(atmosphereIntensity(0)).toBeCloseTo(0.3, 5);
    expect(atmosphereIntensity(1)).toBeCloseTo(1, 5);
  });

  it('is monotonic and clamps out-of-range presence', () => {
    expect(atmosphereIntensity(0.6)).toBeGreaterThan(atmosphereIntensity(0.3));
    expect(atmosphereIntensity(-2)).toBeCloseTo(0.3, 5);
    expect(atmosphereIntensity(5)).toBeCloseTo(1, 5);
  });
});

describe('prominenceState (star arc cycle)', () => {
  it('is invisible at the start of a cycle and fully risen mid-window', () => {
    expect(prominenceState(0).opacity).toBe(0);
    expect(prominenceState(PROMINENCE_PERIOD * 0.4).opacity).toBeCloseTo(1, 5);
  });

  it('has faded again before the cycle ends and repeats periodically', () => {
    expect(prominenceState(PROMINENCE_PERIOD * 0.95).opacity).toBe(0);
    const a = prominenceState(PROMINENCE_PERIOD * 0.4);
    const b = prominenceState(PROMINENCE_PERIOD * 2.4);
    expect(b.opacity).toBeCloseTo(a.opacity, 5);
  });

  it('advances the cycle counter so each arc re-anchors elsewhere on the limb', () => {
    expect(prominenceState(PROMINENCE_PERIOD * 0.5).cycle).toBe(0);
    expect(prominenceState(PROMINENCE_PERIOD * 2.5).cycle).toBe(2);
    expect(prominenceState(PROMINENCE_PERIOD * 2.5).angle).not.toBeCloseTo(
      prominenceState(PROMINENCE_PERIOD * 0.5).angle,
      3,
    );
  });
});

describe('starRayRotation (anisotropic corona)', () => {
  it('counter-rotates adjacent rays', () => {
    const a = starRayRotation(10, 0, false) - starRayRotation(0, 0, false);
    const b = starRayRotation(10, 1, false) - starRayRotation(0, 1, false);
    expect(a).toBeGreaterThan(0);
    expect(b).toBeLessThan(0);
  });

  it('holds a static per-ray offset under reduced motion', () => {
    expect(starRayRotation(50, 1, true)).toBe(starRayRotation(0, 1, true));
    expect(starRayRotation(0, 0, true)).not.toBe(starRayRotation(0, 1, true));
  });
});
