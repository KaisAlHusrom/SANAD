import { describe, expect, it } from 'vitest';
import { IGNITION_MS, shouldPlayIgnition } from './ignition';

const READY = {
  reducedMotion: false,
  touch: false,
  alreadyPlayed: false,
  canvasPresent: true,
};

describe('shouldPlayIgnition (the once-per-session arrival moment)', () => {
  it('plays on a fresh full-motion desktop visit with the cosmos mounted', () => {
    expect(shouldPlayIgnition(READY)).toBe(true);
  });

  it('never plays twice in a session', () => {
    expect(shouldPlayIgnition({ ...READY, alreadyPlayed: true })).toBe(false);
  });

  it('skips calm mode entirely (WEB4)', () => {
    expect(shouldPlayIgnition({ ...READY, reducedMotion: true })).toBe(false);
  });

  it('skips touch/mobile (no cosmos, no ignition)', () => {
    expect(shouldPlayIgnition({ ...READY, touch: true })).toBe(false);
    expect(shouldPlayIgnition({ ...READY, canvasPresent: false })).toBe(false);
  });

  it('runs about a second — an arrival beat, not a loader', () => {
    expect(IGNITION_MS).toBeGreaterThanOrEqual(800);
    expect(IGNITION_MS).toBeLessThanOrEqual(1500);
  });
});
