import { describe, expect, it } from 'vitest';
import { DEFAULT_ROUNDING, roundTo } from './rounding.js';

describe('roundTo (explicit, tested rounding)', () => {
  it('defaults to half-up — the convention every invoice in the region prints', () => {
    expect(DEFAULT_ROUNDING).toBe('half-up');
    expect(roundTo(2.5, 'half-up')).toBe(3);
    expect(roundTo(3.5, 'half-up')).toBe(4);
  });

  it('rounds half-up AWAY FROM ZERO for negatives — never JS `Math.round(-2.5) === -2`', () => {
    expect(roundTo(-2.5, 'half-up')).toBe(-3);
    expect(roundTo(-3.5, 'half-up')).toBe(-4);
  });

  it('rounds half-even to the nearest even at the exact midpoint', () => {
    expect(roundTo(2.5, 'half-even')).toBe(2);
    expect(roundTo(3.5, 'half-even')).toBe(4);
    expect(roundTo(-2.5, 'half-even')).toBe(-2);
    expect(roundTo(2.4, 'half-even')).toBe(2);
  });

  it('truncates toward zero on `down` and away from zero on `up`', () => {
    expect(roundTo(2.9, 'down')).toBe(2);
    expect(roundTo(-2.9, 'down')).toBe(-2);
    expect(roundTo(2.1, 'up')).toBe(3);
    expect(roundTo(-2.1, 'up')).toBe(-3);
  });

  it('leaves an already-integer value alone in every mode', () => {
    for (const mode of ['half-up', 'half-even', 'up', 'down'] as const) {
      expect(roundTo(7, mode)).toBe(7);
      expect(roundTo(-7, mode)).toBe(-7);
    }
  });
});
