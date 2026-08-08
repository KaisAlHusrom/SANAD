import { clamp } from './smoothstep';

/**
 * The camera flight (WEB10). The camera travels straight down the Y axis across the whole scroll
 * — `cameraY` maps normalized progress (0→1) to the ~2000-unit journey — while the cursor adds a
 * small parallax lean and the look-at target tracks just below the camera. Pure/testable; the
 * scene applies these each frame (transform-only, 60fps).
 */

/** Total world-units the camera descends across the full page (the reference flight length). */
export const TOTAL_TRAVEL = 2000;
/** Max cursor parallax offsets (px-equivalent world units), from the reference. */
const PARALLAX_X = 46;
const PARALLAX_Y = 16;
/** The look-at sits this far below the camera so the flight reads as a descent. */
const LOOK_BELOW = 30;
const LOOK_LEAD_X = 20;

export function cameraY(progress: number): number {
  // travels DOWN the −Y axis (reference sign) so the world-fixed star field streams toward the
  // viewer and the look-at (`camY − 30`) points in the direction of travel.
  return -clamp(progress, 0, 1) * TOTAL_TRAVEL;
}

export function cameraParallax(
  cursorX: number,
  cursorY: number,
): { x: number; y: number } {
  return {
    x: clamp(cursorX, -1, 1) * PARALLAX_X,
    // screen-up (positive cursorY) leans the camera down → negated (reference sign)
    y: clamp(cursorY, -1, 1) * -PARALLAX_Y,
  };
}

export function lookAtTarget(
  cursorX: number,
  camY: number,
): { x: number; y: number; z: number } {
  return { x: clamp(cursorX, -1, 1) * LOOK_LEAD_X, y: camY - LOOK_BELOW, z: 0 };
}

/** How much of the interpolated world-x the camera chases (±255 world-x → ≤ ~±20 units of lean). */
const LEAN = 0.08;
/** Max transition roll (rad) ≈ 1.2° — a lean you feel, not a barrel roll. */
const MAX_ROLL = 0.021;
/** World-x delta that earns the full roll. */
const ROLL_DX = 500;

/**
 * 8.B-4 Stage 3a — the flight banks: the camera drifts a fraction of the way toward the side the
 * docking world sits on (`x`, world units) and rolls into each transition (`roll`, rad, sign =
 * direction of travel, zero at every dock). Worlds are evenly spaced across the flight like
 * `worldColorAt`; the x-chase eases between docks and the roll rides a bell over each transition.
 * The scene adds `x` to the cursor parallax and applies `roll` after `lookAt`.
 */
export function cameraBank(
  progress: number,
  worldXs: readonly number[],
): { x: number; roll: number } {
  const n = worldXs.length;
  const first = worldXs[0];
  if (n === 0 || first === undefined) return { x: 0, roll: 0 };
  if (n === 1) return { x: first * LEAN, roll: 0 };
  const p = clamp(progress, 0, 1);
  const scaled = p * (n - 1);
  const i = Math.min(Math.floor(scaled), n - 2);
  const f = scaled - i;
  const a = worldXs[i] ?? first;
  const b = worldXs[i + 1] ?? first;
  const eased = f * f * (3 - 2 * f);
  const bell = 4 * f * (1 - f);
  return {
    x: (a + (b - a) * eased) * LEAN,
    roll: clamp((b - a) / ROLL_DX, -1, 1) * MAX_ROLL * bell,
  };
}

/** Rest field of view (deg) — the reference camera. */
const FOV_REST = 60;
/** Full-warp widening (deg) — fast scroll stretches the view, then it settles back. */
const FOV_KICK = 9;

/**
 * 8.B-4 Stage 3b — scroll velocity widens the field of view (60° → 69° at full warp) so a fast
 * flight *feels* fast. The scene feeds `0` under reduced motion and only touches the projection
 * matrix when the value meaningfully changes.
 */
export function warpFov(warp: number): number {
  return FOV_REST + clamp(warp, 0, 1) * FOV_KICK;
}
