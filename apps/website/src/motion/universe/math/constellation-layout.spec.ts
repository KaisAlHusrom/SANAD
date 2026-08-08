import { describe, expect, it } from 'vitest';
import { constellationLayout } from './constellation-layout';

describe('constellationLayout (the services worlds on their ring)', () => {
  it('places count worlds evenly around the ring at the given radius', () => {
    const slots = constellationLayout(5, 200);
    expect(slots).toHaveLength(5);
    for (const slot of slots) {
      const planar = Math.hypot(slot.x, slot.z / 0.45);
      expect(planar).toBeCloseTo(200, 3);
    }
    // distinct angles, evenly spaced
    const [first, second] = slots;
    expect((second?.angle ?? 0) - (first?.angle ?? 0)).toBeCloseTo(
      (Math.PI * 2) / 5,
      5,
    );
  });

  it('staggers heights subtly (a constellation, not a flat disc) and stays bounded', () => {
    const slots = constellationLayout(6, 200);
    const ys = slots.map((s) => s.y);
    expect(new Set(ys.map((y) => y.toFixed(3))).size).toBeGreaterThan(1);
    for (const y of ys) expect(Math.abs(y)).toBeLessThanOrEqual(200 * 0.15);
  });

  it('is deterministic', () => {
    expect(constellationLayout(4, 100)).toEqual(constellationLayout(4, 100));
  });
});
