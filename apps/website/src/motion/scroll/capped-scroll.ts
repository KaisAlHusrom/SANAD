/**
 * Speed-capped smooth scroll (WS4 — "constant-speed catch-up"). Wheel/keyboard input feeds a
 * target position; the real scroll advances toward it at a hard **px/second ceiling**, so a violent
 * flick can never outrun the reading pace (every planet stays visible on the way past), yet a small
 * scroll still settles quickly. Ported from the reference `setupSmoothScroll`/`updateSmoothScroll`.
 *
 * These are the **pure** pieces (frame-rate independent, no DOM, no wall-clock) — the DOM wiring
 * (listeners + `window.scrollTo`) lives in `motion-provider.tsx`. Because the real `window.scrollY`
 * stays the single time base for GSAP ScrollTrigger, the works orbit, the finale and the cosmos
 * store, DOM + WebGL stay in sync by construction — the cap can't desync content from its planet.
 */

/** Scroll pace presets (px/second). `balanced` is the reference default. */
export const SCROLL_SPEEDS = {
  relaxed: 720,
  balanced: 1000,
  brisk: 1450,
} as const;

/** The active ceiling for this build. */
export const MAX_SCROLL_SPEED = SCROLL_SPEEDS.balanced;

/** Below this remaining distance (px) we snap to the target rather than easing forever. */
const SNAP_EPSILON = 0.4;

/** Ease-out rate for the frame-rate-independent approach (higher = snappier landing). */
const EASE_RATE = 9;

/** Keyboard step sizes (reference): arrows nudge, page/space jump ~82% of the viewport. */
const ARROW_STEP = 90;
const PAGE_FRACTION = 0.82;

/** Wheel `deltaMode` scaling: line-mode ≈ 32px/line; page-mode = one viewport. */
const LINE_TO_PX = 32;

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * How far the wheel may push the target ahead of the current position — 14% of the ceiling with a
 * 90px floor. Keeps a whisper of smoothing without *banking* distance, so motion stops when the
 * wheel stops (a fast flick doesn't keep replaying after your finger lifts).
 */
export function scrollLead(maxSpeed: number): number {
  return Math.max(90, maxSpeed * 0.14);
}

/**
 * Advance `current` toward `target` by one frame: a frame-rate-independent ease-out
 * (`diff·(1 − e^(−dt·rate))`), then clamped so the move never exceeds `maxSpeed·dt`. Snaps when the
 * remaining distance is sub-pixel. Never overshoots.
 */
export function stepCappedScroll(
  current: number,
  target: number,
  dtSeconds: number,
  maxSpeed: number,
): number {
  const diff = target - current;
  if (Math.abs(diff) < SNAP_EPSILON) return target;
  let step = diff * (1 - Math.exp(-dtSeconds * EASE_RATE));
  const cap = maxSpeed * dtSeconds;
  if (step > cap) step = cap;
  else if (step < -cap) step = -cap;
  return current + step;
}

/**
 * Clamp a freshly-pushed target so it (a) never sits more than one `lead` step from `current`
 * (no banked scroll) and (b) stays within the scrollable range `[0, maxY]`.
 */
export function clampScrollTarget(
  target: number,
  current: number,
  lead: number,
  maxY: number,
): number {
  const leadClamped = clamp(target, current - lead, current + lead);
  return clamp(leadClamped, 0, maxY);
}

/** Normalize a `wheel` event delta to pixels given its `deltaMode` (0=px, 1=line, 2=page). */
export function normalizeWheelDelta(
  deltaY: number,
  deltaMode: number,
  viewportH: number,
): number {
  if (deltaMode === 1) return deltaY * LINE_TO_PX;
  if (deltaMode === 2) return deltaY * viewportH;
  return deltaY;
}

/**
 * The scroll delta (px) for a handled key, or `null` for keys we don't drive. `Home`/`End` are
 * absolute jumps handled by the caller, not returned here.
 */
export function keyScrollDelta(key: string, viewportH: number): number | null {
  switch (key) {
    case 'ArrowDown':
      return ARROW_STEP;
    case 'ArrowUp':
      return -ARROW_STEP;
    case 'PageDown':
    case ' ':
    case 'Spacebar':
      return viewportH * PAGE_FRACTION;
    case 'PageUp':
      return -viewportH * PAGE_FRACTION;
    default:
      return null;
  }
}
