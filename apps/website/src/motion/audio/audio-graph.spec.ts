import { describe, expect, it } from 'vitest';
import {
  ambientGain,
  chimeFrequency,
  ctaFrequency,
  envelopeGain,
  sectionIndexAt,
} from './audio-graph';
import {
  AMBIENT_BASE_GAIN,
  AMBIENT_MAX_GAIN,
  PENTATONIC_SEMITONES,
  ROOT_HZ,
  WORLD_COUNT,
} from './cue-defs';

describe('sectionIndexAt', () => {
  it('maps the whole scroll onto 0…worldCount−1, snapping to the nearest world', () => {
    expect(sectionIndexAt(0, WORLD_COUNT)).toBe(0);
    expect(sectionIndexAt(1, WORLD_COUNT)).toBe(WORLD_COUNT - 1);
    // world i sits at i/(n−1); a point just past a boundary rounds up
    const step = 1 / (WORLD_COUNT - 1);
    expect(sectionIndexAt(step * 0.49, WORLD_COUNT)).toBe(0);
    expect(sectionIndexAt(step * 0.51, WORLD_COUNT)).toBe(1);
    expect(sectionIndexAt(step * 4, WORLD_COUNT)).toBe(4);
  });

  it('clamps out-of-range progress and degenerate world counts', () => {
    expect(sectionIndexAt(-2, WORLD_COUNT)).toBe(0);
    expect(sectionIndexAt(9, WORLD_COUNT)).toBe(WORLD_COUNT - 1);
    expect(sectionIndexAt(0.5, 1)).toBe(0);
    expect(sectionIndexAt(0.5, 0)).toBe(0);
  });
});

describe('chimeFrequency / ctaFrequency', () => {
  it('gives one pentatonic note per world, ascending, index-clamped', () => {
    expect(chimeFrequency(0)).toBeCloseTo(ROOT_HZ, 5);
    for (let i = 1; i < WORLD_COUNT; i++) {
      expect(chimeFrequency(i)).toBeGreaterThan(chimeFrequency(i - 1));
    }
    // octave note (semitone 12) is exactly double the root
    const octaveIndex = PENTATONIC_SEMITONES.indexOf(12);
    expect(chimeFrequency(octaveIndex)).toBeCloseTo(ROOT_HZ * 2, 4);
    // out-of-range indices clamp to the ends, never NaN
    expect(chimeFrequency(-5)).toBeCloseTo(ROOT_HZ, 5);
    expect(chimeFrequency(999)).toBeCloseTo(chimeFrequency(WORLD_COUNT - 1), 5);
  });

  it('CTA tone is a perfect fifth above the root', () => {
    expect(ctaFrequency()).toBeCloseTo(ROOT_HZ * Math.pow(2, 7 / 12), 4);
  });
});

describe('ambientGain', () => {
  it('is quiet at rest and rises monotonically with warp, hard-capped low', () => {
    expect(ambientGain(0)).toBeCloseTo(AMBIENT_BASE_GAIN, 5);
    expect(ambientGain(0.5)).toBeGreaterThan(ambientGain(0));
    expect(ambientGain(1)).toBeGreaterThan(ambientGain(0.5));
    expect(ambientGain(1)).toBeLessThanOrEqual(AMBIENT_MAX_GAIN);
    // clamps a runaway warp and never goes below the base
    expect(ambientGain(50)).toBeLessThanOrEqual(AMBIENT_MAX_GAIN);
    expect(ambientGain(-1)).toBeCloseTo(AMBIENT_BASE_GAIN, 5);
  });
});

describe('envelopeGain', () => {
  it('is 0 before trigger, peaks at the attack, then decays toward 0', () => {
    const attack = 0.01;
    const decay = 0.8;
    expect(envelopeGain(0, attack, decay)).toBe(0);
    expect(envelopeGain(-1, attack, decay)).toBe(0);
    expect(envelopeGain(attack, attack, decay)).toBeCloseTo(1, 5);
    expect(envelopeGain(attack + decay * 0.25, attack, decay)).toBeLessThan(1);
    expect(envelopeGain(attack + decay * 0.5, attack, decay)).toBeLessThan(
      envelopeGain(attack + decay * 0.25, attack, decay),
    );
    expect(envelopeGain(attack + decay, attack, decay)).toBe(0);
  });
});
