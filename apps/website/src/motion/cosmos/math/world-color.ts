import { clamp, lerpTriplet } from './smoothstep';
import type { ColorTriplet } from '../types';

/**
 * The scene's ambient colour at a given scroll position — the glow of the world you're over,
 * cross-faded with the next as you pass a section boundary. Drives the fog, the sun light, and
 * the world-veil so WebGL + DOM stay colour-locked to one source. Worlds are spaced evenly across
 * the 0→1 flight; at a world's centre you get its glow, at a boundary a 50/50 mix. Pure/testable.
 */
export function worldColorAt(
  progress: number,
  glows: readonly ColorTriplet[],
): ColorTriplet {
  const n = glows.length;
  const first = glows[0];
  if (n === 0 || !first) return [1, 1, 1];
  if (n === 1) return first;
  const p = clamp(progress, 0, 1);
  const scaled = p * (n - 1);
  const i = Math.min(Math.floor(scaled), n - 2);
  const f = scaled - i;
  const a = glows[i] ?? first;
  const b = glows[i + 1] ?? first;
  return lerpTriplet(a, b, f);
}
