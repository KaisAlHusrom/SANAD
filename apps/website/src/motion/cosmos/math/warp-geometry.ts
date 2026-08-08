import { clamp } from './smoothstep';

/**
 * Hyperspace warp streaks — the velocity-reactive "jump to lightspeed" lines radiating from the
 * camera. Their count grows and they lengthen + brighten with `warp` (the smoothed scroll
 * velocity), and vanish entirely below a small threshold so a still page is calm (WEB9 — a signed
 * effect, not a permanent particle field). Pure/testable; the builder lays out the angular geometry,
 * this drives count/length/opacity.
 */

const MIN_COUNT = 70;
const MAX_COUNT = 150;
/** Below this warp the streaks are invisible (a resting page shows none). */
const THRESHOLD = 0.015;
const BASE_LENGTH = 8;
const LENGTH_GAIN = 150;
const MAX_OPACITY = 0.5;

export function warpStreakCount(warp: number): number {
  return Math.round(MIN_COUNT + clamp(warp, 0, 1) * (MAX_COUNT - MIN_COUNT));
}

export function warpStreak(warp: number): { length: number; opacity: number } {
  const w = clamp(warp, 0, 1);
  return {
    length: BASE_LENGTH + w * LENGTH_GAIN,
    opacity: w > THRESHOLD ? w * MAX_OPACITY : 0,
  };
}
