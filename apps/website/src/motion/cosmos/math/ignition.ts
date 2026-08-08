/**
 * The ignition gate (8.B-4 Stage 5b) — the once-per-session arrival beat where the hero star
 * ignites out of black. This module is the pure PLAY/SKIP decision; the DOM veil + timing live in
 * `ignition-gate.tsx`. It is tied to **real readiness** (fonts + the cosmos canvas), never a fake
 * loader (WEB9): no canvas (mobile/reduced/touch) → no ignition, straight to content (WEB4).
 */

/** The full beat — an arrival moment, deliberately about a second, never a loading screen. */
export const IGNITION_MS = 1100;

export interface IgnitionContext {
  readonly reducedMotion: boolean;
  readonly touch: boolean;
  /** Already played this session (`sessionStorage`). */
  readonly alreadyPlayed: boolean;
  /** The WebGL cosmos actually mounted (there is a star to ignite). */
  readonly canvasPresent: boolean;
}

export function shouldPlayIgnition(ctx: IgnitionContext): boolean {
  return (
    !ctx.reducedMotion && !ctx.touch && !ctx.alreadyPlayed && ctx.canvasPresent
  );
}
