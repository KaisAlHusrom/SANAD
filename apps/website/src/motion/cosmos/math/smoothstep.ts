import type { ColorTriplet } from '../types';

/**
 * The shared scalar primitives every other cosmos-math module builds on (one definition, DRY).
 * Pure and frame-independent — the Three scene reads only these + the modules above them, so all
 * animation behaviour is unit-testable in isolation (the WebGL assembly is verified by looking,
 * U21e).
 */

/**
 * A deterministic 0..1 hash of an integer/float seed (the GLSL `fract(sin(n)·43758…)` idiom in TS).
 * Used wherever set dressing needs stable "randomness" that tests can pin down — unlike
 * `Math.random`, the same seed always deals the same value.
 */
export function hash01(n: number): number {
  const s = Math.sin(n) * 43758.5453123;
  return s - Math.floor(s);
}

/** Clamp `x` into `[min, max]`. */
export function clamp(x: number, min: number, max: number): number {
  return x < min ? min : x > max ? max : x;
}

/** Linear interpolate `a → b` by `t` (unclamped — callers clamp `t` when needed). */
export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/** Classic Hermite smoothstep: 0 below `edge0`, 1 above `edge1`, eased S-curve between. */
export function smoothstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/** Ken Perlin's smootherstep (zero 1st + 2nd derivative at the edges) — for the gentlest ramps. */
export function smootherstep(edge0: number, edge1: number, x: number): number {
  if (edge0 === edge1) return x < edge0 ? 0 : 1;
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * t * (t * (t * 6 - 15) + 10);
}

/** Interpolate two normalized RGB triplets channel-wise by `t`. */
export function lerpTriplet(
  a: ColorTriplet,
  b: ColorTriplet,
  t: number,
): ColorTriplet {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}
