import { describe, expect, it } from 'vitest';
import {
  CONSTELLATION_VIEW,
  constellationDraw,
  constellationLayout,
  starReveal,
} from './constellation-geometry.js';

describe('constellationLayout (trust domain constellation)', () => {
  it('returns an empty layout for zero domains', () => {
    expect(constellationLayout(0)).toEqual({ stars: [], links: [] });
  });

  it('lays out one star per domain, chained by hairline links', () => {
    const layout = constellationLayout(5);
    expect(layout.stars).toHaveLength(5);
    // an open chain across the asterism: n-1 links for n ≤ 5 stars
    expect(layout.links).toHaveLength(4);
    expect(layout.links[0]).toEqual([0, 1]);
    expect(layout.links[3]).toEqual([3, 4]);
  });

  it('attaches stars beyond the main chain as authored branches, not a snake', () => {
    const layout = constellationLayout(7);
    // chain over the first 5 + one branch link per extra star
    expect(layout.links).toHaveLength(6);
    for (const [a, b] of layout.links) {
      expect(a).not.toBe(b);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThan(7);
      expect(b).toBeLessThan(7);
    }
  });

  it('clamps to the authored anchor count instead of inventing positions', () => {
    expect(constellationLayout(40).stars.length).toBe(
      constellationLayout(99).stars.length,
    );
  });

  it('keeps every star inside the viewBox with 1-decimal coordinates (SSR hydration-stable)', () => {
    for (const star of constellationLayout(8).stars) {
      expect(star.x).toBeGreaterThanOrEqual(0);
      expect(star.x).toBeLessThanOrEqual(CONSTELLATION_VIEW.width);
      expect(star.y).toBeGreaterThanOrEqual(0);
      expect(star.y).toBeLessThanOrEqual(CONSTELLATION_VIEW.height);
      // one decimal max — full-precision floats in SSR'd SVG attrs hydration-mismatch
      expect(star.x).toBeCloseTo(Math.round(star.x * 10) / 10, 10);
      expect(star.y).toBeCloseTo(Math.round(star.y * 10) / 10, 10);
    }
  });

  it('is deterministic — no randomness, same layout every call', () => {
    expect(constellationLayout(6)).toEqual(constellationLayout(6));
  });

  it('places labels away from the nearest viewBox edge', () => {
    for (const star of constellationLayout(8).stars) {
      expect(star.labelSide).toBe(star.y < 30 ? 'below' : 'above');
    }
  });

  it('varies star sizes deterministically so the field reads as depth, not a grid', () => {
    const layout = constellationLayout(5);
    const radii = new Set(layout.stars.map((star) => star.r));
    expect(radii.size).toBeGreaterThan(1);
  });
});

describe('constellationDraw (scroll-linked line draw, gated to the dock)', () => {
  it('is fully undrawn before the world docks and fully drawn at the dock plateau', () => {
    expect(constellationDraw(0)).toBe(0);
    expect(constellationDraw(0.3)).toBe(0);
    expect(constellationDraw(0.75)).toBe(1);
  });

  it('rises monotonically through the dock window', () => {
    let prev = 0;
    for (let local = 0.3; local <= 0.8; local += 0.05) {
      const next = constellationDraw(local);
      expect(next).toBeGreaterThanOrEqual(prev);
      prev = next;
    }
  });
});

describe('starReveal (staggered star pop as the lines reach each star)', () => {
  it('reveals earlier stars before later ones', () => {
    const draw = 0.5;
    expect(starReveal(0, 5, draw)).toBeGreaterThan(starReveal(4, 5, draw));
  });

  it('all stars hidden at 0 and shown at full draw', () => {
    expect(starReveal(0, 5, 0)).toBe(0);
    expect(starReveal(4, 5, 1)).toBe(1);
  });
});
