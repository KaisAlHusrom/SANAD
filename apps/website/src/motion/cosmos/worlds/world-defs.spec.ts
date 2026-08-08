import { describe, expect, it } from 'vitest';
import { WORLD_DEFS, WORLD_GLOWS, hexToTriplet } from './world-defs';

describe('hexToTriplet', () => {
  it('normalizes a hex colour to 0..1 RGB', () => {
    expect(hexToTriplet('#ffffff')).toEqual([1, 1, 1]);
    expect(hexToTriplet('#000000')).toEqual([0, 0, 0]);
    const [r, g, b] = hexToTriplet('#22d3ee');
    expect(r).toBeCloseTo(0x22 / 255, 5);
    expect(g).toBeCloseTo(0xd3 / 255, 5);
    expect(b).toBeCloseTo(0xee / 255, 5);
  });
});

describe('WORLD_DEFS (scene worlds)', () => {
  it('derives the nine worlds in scroll order from the config', () => {
    expect(WORLD_DEFS).toHaveLength(9);
    expect(WORLD_DEFS[0]?.id).toBe('hero');
    expect(WORLD_DEFS[8]?.id).toBe('cta');
  });

  it('every colour channel is normalized into [0,1] and each has 3 palette shades', () => {
    for (const world of WORLD_DEFS) {
      world.glow.forEach((c) => {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      });
      expect(world.palette).toHaveLength(3);
      expect(world.position).toHaveLength(3);
      expect(world.radius).toBeGreaterThan(0);
    }
  });

  it('the works world is the ringed purple centrepiece docked close to the camera', () => {
    const works = WORLD_DEFS.find((w) => w.id === 'works');
    expect(works?.ring).toBe(true);
    expect(works?.radius).toBe(138);
    // reference off z is -30 (the cards orbit in front of a near planet), not deep space
    expect(works?.position[2]).toBe(-30);
  });

  it('places the process world at the reference offset', () => {
    const process = WORLD_DEFS.find((w) => w.id === 'process');
    expect(process?.position).toEqual([0, -30, -60]);
  });

  it('carries a per-section fog tint (deep-space colour, distinct from the glow)', () => {
    for (const world of WORLD_DEFS) {
      expect(world.fog).toHaveLength(3);
      world.fog.forEach((c) => {
        expect(c).toBeGreaterThanOrEqual(0);
        expect(c).toBeLessThanOrEqual(1);
      });
    }
    // hero's deep-space fog is #060912 — not its cyan glow
    const hero = WORLD_DEFS[0];
    expect(hero?.fog).toEqual(hexToTriplet('#060912'));
  });

  it('exposes glows in order for fog/veil interpolation', () => {
    expect(WORLD_GLOWS).toHaveLength(9);
    expect(WORLD_GLOWS[0]).toEqual(WORLD_DEFS[0]?.glow);
  });
});
