import { clamp, smoothstep } from './smoothstep';

/**
 * The pure timing/intensity math behind the "planets alive" upgrade (8.B-4 Stage 1): the gas-surface
 * flow clock, the fresnel-atmosphere intensity curve, the star prominence cycle, and the corona-ray
 * rotation. The GLSL that consumes these lives in `scene/` (verified by looking, U21e); everything
 * frame-rate-independent is here so the behaviour is unit-testable (TDD1).
 */

/** One prominence arc lives per cycle (seconds of `clock.elapsedTime`). */
export const PROMINENCE_PERIOD = 16;
/** Golden angle (rad) — successive prominence arcs re-anchor around the limb without repeating. */
const GOLDEN_ANGLE = 2.399963229728653;
/** Corona rays spin this slowly (rad/s) — visible only as a patient shimmer. */
const RAY_SPEED = 0.03;
/** Static fan-out between rays (rad) so stacked rays never align. */
const RAY_OFFSET = 0.9;

/**
 * The clock the gas-surface flow shader reads (`uFlowTime`). Full motion streams the rAF clock
 * through; reduced motion freezes the surface at its authored state (calm mode, WEB4).
 */
export function gasFlowTime(elapsed: number, reducedMotion: boolean): number {
  return reducedMotion ? 0 : elapsed;
}

/**
 * Fresnel-shell intensity from the planet's dock presence: a faint 0.3 glimmer while the world is
 * off in deep space (it still reads as a lit body) rising to full limb light at dock.
 */
export function atmosphereIntensity(presence: number): number {
  return 0.3 + 0.7 * clamp(presence, 0, 1);
}

/** One star-prominence arc: its opacity envelope, the cycle index, and this cycle's limb anchor. */
export interface ProminenceState {
  /** 0 → 1 → 0 across the visible window of the cycle. */
  readonly opacity: number;
  /** Which cycle we're in — re-anchors the arc each period. */
  readonly cycle: number;
  /** The arc's anchor angle around the limb this cycle (golden-angle walk, rad). */
  readonly angle: number;
}

/**
 * A slow solar-prominence cycle: every {@link PROMINENCE_PERIOD} seconds an arc rises out of the
 * limb (5%→25% of the cycle), holds, and sinks back (55%→80%), anchored at a new golden-angle spot
 * each cycle so the star never repeats itself. Deterministic from the clock — no randomness.
 */
export function prominenceState(elapsed: number): ProminenceState {
  const cycle = Math.floor(elapsed / PROMINENCE_PERIOD);
  const phase = elapsed / PROMINENCE_PERIOD - cycle;
  const opacity =
    smoothstep(0.05, 0.25, phase) * (1 - smoothstep(0.55, 0.8, phase));
  return { opacity, cycle, angle: cycle * GOLDEN_ANGLE };
}

/**
 * Sprite rotation of corona ray `index`: adjacent rays counter-rotate (even = with the clock,
 * odd = against) around a static fan-out, so the star's spikes shimmer instead of spinning as one
 * rigid cross. Reduced motion holds each ray at its fan-out angle.
 */
export function starRayRotation(
  elapsed: number,
  index: number,
  reducedMotion: boolean,
): number {
  const base = index * RAY_OFFSET;
  if (reducedMotion) return base;
  const dir = index % 2 === 0 ? 1 : -1;
  return base + dir * elapsed * RAY_SPEED;
}
