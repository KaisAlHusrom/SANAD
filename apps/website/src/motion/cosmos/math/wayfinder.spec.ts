import { describe, expect, it } from 'vitest';
import { activeSectionIndex } from './wayfinder';

describe('activeSectionIndex (the constellation rail tracks the journey)', () => {
  // real chapter tops are unevenly spaced (tall docking stages, the works pin) — the rail must
  // track actual geometry, never assume even spacing
  const TOPS = [0, 900, 3200, 5600, 7100, 11400, 12800, 14600, 16300];

  it('names the first station before any scroll and the last at the end', () => {
    expect(activeSectionIndex(0, TOPS)).toBe(0);
    expect(activeSectionIndex(99999, TOPS)).toBe(TOPS.length - 1);
  });

  it('activates a station once the viewport centre passes its top', () => {
    expect(activeSectionIndex(899, TOPS)).toBe(0);
    expect(activeSectionIndex(900, TOPS)).toBe(1);
    expect(activeSectionIndex(12799, TOPS)).toBe(5);
    expect(activeSectionIndex(12800, TOPS)).toBe(6);
  });

  it('is safe on an empty list and a negative centre', () => {
    expect(activeSectionIndex(500, [])).toBe(0);
    expect(activeSectionIndex(-40, TOPS)).toBe(0);
  });
});
