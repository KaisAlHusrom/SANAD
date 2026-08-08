import { describe, expect, it } from 'vitest';
import {
  clamp,
  lerp,
  smoothstep,
  smootherstep,
  lerpTriplet,
} from './smoothstep';
import {
  cameraBank,
  cameraY,
  cameraParallax,
  lookAtTarget,
  warpFov,
} from './camera';
import { planetPresence } from './presence';
import { coinTransform } from './coin';
import { worldColorAt } from './world-color';
import type { ColorTriplet } from '../types';

describe('smoothstep primitives', () => {
  it('clamps into range', () => {
    expect(clamp(-1, 0, 1)).toBe(0);
    expect(clamp(2, 0, 1)).toBe(1);
    expect(clamp(0.5, 0, 1)).toBe(0.5);
  });

  it('lerps endpoints', () => {
    expect(lerp(0, 10, 0)).toBe(0);
    expect(lerp(0, 10, 1)).toBe(10);
    expect(lerp(0, 10, 0.5)).toBe(5);
  });

  it('smoothstep is 0 below edge0, 1 above edge1, 0.5 at the midpoint, monotonic', () => {
    expect(smoothstep(0, 1, -0.5)).toBe(0);
    expect(smoothstep(0, 1, 1.5)).toBe(1);
    expect(smoothstep(0, 1, 0.5)).toBeCloseTo(0.5, 5);
    expect(smoothstep(0, 1, 0.75)).toBeGreaterThan(smoothstep(0, 1, 0.25));
  });

  it('smoothstep tolerates a zero-width edge (no divide-by-zero)', () => {
    expect(smoothstep(0.5, 0.5, 0.4)).toBe(0);
    expect(smoothstep(0.5, 0.5, 0.6)).toBe(1);
  });

  it('smootherstep hits the same endpoints/midpoint', () => {
    expect(smootherstep(0, 1, 0)).toBe(0);
    expect(smootherstep(0, 1, 1)).toBe(1);
    expect(smootherstep(0, 1, 0.5)).toBeCloseTo(0.5, 5);
  });

  it('lerpTriplet blends channel-wise', () => {
    const a: ColorTriplet = [0, 0, 0];
    const b: ColorTriplet = [1, 0.5, 0.25];
    expect(lerpTriplet(a, b, 0.5)).toEqual([0.5, 0.25, 0.125]);
  });
});

describe('cameraY / parallax / lookAt (the flight)', () => {
  it('descends the −Y axis 0 → −2000 across the page and clamps', () => {
    expect(cameraY(0)).toBeCloseTo(0, 10);
    expect(cameraY(1)).toBe(-2000);
    expect(cameraY(0.5)).toBe(-1000);
    expect(cameraY(2)).toBe(-2000);
  });

  it('parallax clamps to ±46 X / ∓16 Y (Y sign inverted)', () => {
    expect(cameraParallax(1, 1)).toEqual({ x: 46, y: -16 });
    expect(cameraParallax(-1, -1)).toEqual({ x: -46, y: 16 });
    expect(cameraParallax(5, 5)).toEqual({ x: 46, y: -16 });
    const zero = cameraParallax(0, 0);
    expect(zero.x).toBeCloseTo(0, 10);
    expect(zero.y).toBeCloseTo(0, 10);
  });

  it('look-at tracks 30 below the camera', () => {
    const camY = cameraY(0.5);
    expect(lookAtTarget(0, camY)).toEqual({ x: 0, y: camY - 30, z: 0 });
    expect(lookAtTarget(1, camY).x).toBe(20);
  });
});

describe('cameraBank (8.B-4 — the flight leans into each docking world)', () => {
  // a 3-world flight: first world left, second right, third centred
  const XS = [-200, 250, 0] as const;

  it('leans toward the docked world side at each world centre, with no roll', () => {
    const first = cameraBank(0, XS);
    const second = cameraBank(0.5, XS);
    expect(first.x).toBeLessThan(0);
    expect(second.x).toBeGreaterThan(0);
    expect(first.roll).toBeCloseTo(0, 5);
    expect(second.roll).toBeCloseTo(0, 5);
  });

  it('rolls mid-transition, signed by the direction of travel, within ±1.2°', () => {
    const toRight = cameraBank(0.25, XS); // flying from x −200 toward +250
    const toLeft = cameraBank(0.75, XS); // flying from +250 back toward 0
    expect(toRight.roll).toBeGreaterThan(0.003);
    expect(toLeft.roll).toBeLessThan(-0.003);
    expect(Math.abs(toRight.roll)).toBeLessThanOrEqual(0.021);
    expect(Math.abs(toLeft.roll)).toBeLessThanOrEqual(0.021);
  });

  it('stays level on an empty or single-world flight and clamps progress', () => {
    expect(cameraBank(0.5, [])).toEqual({ x: 0, roll: 0 });
    expect(cameraBank(0.5, [120])).toEqual({ x: 120 * 0.08, roll: 0 });
    expect(cameraBank(2, XS).x).toBeCloseTo(cameraBank(1, XS).x, 5);
  });
});

describe('warpFov (8.B-4 — speed widens the view)', () => {
  it('rests at the reference 60° and widens to 69° at full warp', () => {
    expect(warpFov(0)).toBe(60);
    expect(warpFov(1)).toBe(69);
    expect(warpFov(0.5)).toBeCloseTo(64.5, 5);
  });

  it('clamps runaway warp instead of fisheyeing', () => {
    expect(warpFov(3)).toBe(69);
    expect(warpFov(-1)).toBe(60);
  });
});

describe('planetPresence (arrive → dock → exit)', () => {
  it('is absent at the very start and fully docked in the middle', () => {
    expect(planetPresence(0).presence).toBeCloseTo(0, 5);
    expect(planetPresence(0.5).presence).toBeCloseTo(1, 5);
  });

  it('rises from below and dollies forward on arrival (monotonic opacity)', () => {
    const early = planetPresence(0.1);
    const dock = planetPresence(0.5);
    expect(dock.opacity).toBeGreaterThan(early.opacity);
    expect(early.y).toBeLessThan(0); // still below the dock, rising
    expect(dock.y).toBeCloseTo(0, 1); // settled at viewport height
    expect(dock.z).toBeGreaterThan(0); // dollied forward toward the camera
  });

  it('exits up and recedes into depth, shrinking', () => {
    const dock = planetPresence(0.6);
    const gone = planetPresence(1);
    expect(gone.presence).toBeCloseTo(0, 5);
    expect(gone.y).toBeGreaterThan(dock.y); // lifted up
    expect(gone.z).toBeLessThan(dock.z); // receded behind the dock
    expect(gone.scale).toBeLessThan(dock.scale); // shrunk
  });
});

describe('coinTransform (central object)', () => {
  it('spins faster with depth and counter-rotates the gem', () => {
    const shallow = coinTransform(1, 0, 0);
    const deep = coinTransform(1, 1, 0);
    expect(deep.rotY).toBeGreaterThan(shallow.rotY);
    expect(coinTransform(1, 0, 0).gemRotY).toBeLessThan(0); // gem turns the other way
  });

  it('scales 0.78 → ~1.0 out of the hero', () => {
    expect(coinTransform(0, 0, 0).scale).toBeCloseTo(0.78, 5);
    expect(coinTransform(0, 0.2, 0).scale).toBeCloseTo(1.0, 5);
  });

  it('halo grows with warp', () => {
    const calm = coinTransform(0, 0.5, 0).haloScale;
    const fast = coinTransform(0, 0.5, 1).haloScale;
    expect(fast).toBeGreaterThan(calm);
  });

  it('sway mirrors under RTL and calm dampens it', () => {
    const ltr = coinTransform(2, 0.4, 0, 1, 1).swayX;
    const rtl = coinTransform(2, 0.4, 0, -1, 1).swayX;
    expect(rtl).toBeCloseTo(-ltr, 5);
    const calm = coinTransform(2, 0.4, 0, 1, 0.4).swayX;
    expect(Math.abs(calm)).toBeLessThan(Math.abs(ltr));
  });

  it('leads below the camera — a little in the hero, further once in flight', () => {
    const hero = coinTransform(0, 0, 0).leadY;
    const flight = coinTransform(0, 0.5, 0).leadY;
    expect(hero).toBeCloseTo(-46, 5); // ~46 below in the hero
    expect(flight).toBeCloseTo(-128, 5); // ~128 below once clear of it
    expect(flight).toBeLessThan(hero); // drops further ahead as the flight descends
    expect(hero).toBeLessThan(0); // always below the camera
  });
});

describe('worldColorAt (fog/veil colour)', () => {
  const glows: ColorTriplet[] = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];

  it('returns a world glow at its centre', () => {
    expect(worldColorAt(0, glows)).toEqual([1, 0, 0]);
    expect(worldColorAt(0.5, glows)).toEqual([0, 1, 0]);
    expect(worldColorAt(1, glows)).toEqual([0, 0, 1]);
  });

  it('50/50 mixes at a boundary', () => {
    expect(worldColorAt(0.25, glows)).toEqual([0.5, 0.5, 0]);
  });

  it('clamps out-of-range progress and tolerates 0/1-length input', () => {
    expect(worldColorAt(-1, glows)).toEqual([1, 0, 0]);
    expect(worldColorAt(2, glows)).toEqual([0, 0, 1]);
    expect(worldColorAt(0.5, [])).toEqual([1, 1, 1]);
    expect(worldColorAt(0.5, [[0.2, 0.2, 0.2]])).toEqual([0.2, 0.2, 0.2]);
  });
});
