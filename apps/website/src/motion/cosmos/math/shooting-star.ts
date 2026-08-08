import { hash01 } from './smoothstep';

/**
 * The rare shooting star (8.B-4 Stage 2d) — once per {@link SHOOTING_STAR_PERIOD} a thin streak
 * darts across the far field for {@link SHOOTING_STAR_DURATION}, then the sky is quiet again (an
 * event, not a field — WEB9). Deterministic from the rAF clock: each cycle hashes its own start
 * point + heading, so the streak never repeats a path and tests can pin any instant. Reduced motion
 * never fires it (WEB4).
 */

export const SHOOTING_STAR_PERIOD = 31;
export const SHOOTING_STAR_DURATION = 0.9;

export interface ShootingStarState {
  readonly active: boolean;
  /** Camera-relative offsets (world units) — the scene adds the camera position, far z. */
  readonly x: number;
  readonly y: number;
  /** Streak heading (rad) — the sprite material's rotation. */
  readonly angle: number;
  /** Rise-and-fade envelope across the streak. */
  readonly opacity: number;
}

const DARK: ShootingStarState = {
  active: false,
  x: 0,
  y: 0,
  angle: 0,
  opacity: 0,
};

export function shootingStar(
  elapsed: number,
  reducedMotion: boolean,
): ShootingStarState {
  if (reducedMotion) return DARK;
  const cycle = Math.floor(elapsed / SHOOTING_STAR_PERIOD);
  const t = (elapsed - cycle * SHOOTING_STAR_PERIOD) / SHOOTING_STAR_DURATION;
  if (t >= 1) return DARK;

  const seed = cycle * 13 + 3;
  const startX = (hash01(seed) - 0.5) * 1400;
  const startY = 150 + hash01(seed + 1) * 300;
  // always descending, veering left or right per cycle
  const angle = -Math.PI / 2 + (hash01(seed + 2) - 0.5) * 1.4;
  const travel = 500 + hash01(seed + 3) * 260;
  return {
    active: true,
    x: startX + Math.cos(angle) * travel * t,
    y: startY + Math.sin(angle) * travel * t,
    angle,
    opacity: Math.sin(Math.PI * Math.min(t, 1)),
  };
}
