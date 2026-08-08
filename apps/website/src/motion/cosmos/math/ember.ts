import { clamp } from './smoothstep';

/**
 * The rising embers of the footer crater — a slow fountain of sparks lifting from the impact site.
 * `emberDelay` staggers each spark's start across a window (feeds a CSS `animation-delay`, so the
 * loop is GPU-driven, not JS); `emberTransform` is the pure per-phase transform if a spark is driven
 * imperatively instead. `phase` is a 0→1 rise fraction derived from the rAF clock (N3 — never
 * `Date.now()`). Pure/testable.
 */

/** Stagger window in seconds — sparks start spread across 0…5s. */
const STAGGER_SECONDS = 5;
const RISE_VH = 66;
const END_SCALE = 0.2;

export function emberDelay(index: number, count: number): number {
  return count > 0 ? (index / count) * STAGGER_SECONDS : 0;
}

/** Number of ember colours (ice / teal-white / accent / near-white) cycled across the sparks. */
const EMBER_COLORS = 4;

export interface EmberSpec {
  /** Dot diameter in px (2.5–5, reference range). */
  sizePx: number;
  /** Start height above the crater as a % from the bottom (29–35). */
  bottomPct: number;
  /** Rise duration in seconds (6.5–10). */
  durationS: number;
  /** Start delay in seconds (0–5, staggered). */
  delayS: number;
  /** Which of the 4 ember colours to use (0–3). */
  colorIndex: number;
}

/** Round to a short, stable precision so the SSR string equals the client string (the browser
 * rounds sub-pixel CSS lengths on parse, so full-precision floats hydration-mismatch). */
function round(value: number, decimals: number): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}

/**
 * A single ember's spec (footer crater), **deterministic from its index** — no `Math.random()` so
 * SSR and client render identically and the values are testable. Values are rounded to a stable
 * precision (full-precision floats in inline styles hydration-mismatch, since the browser rounds
 * sub-pixel CSS on parse). Sizes/heights/durations/colours spread across the reference ranges;
 * delays stagger the fountain.
 */
export function emberSpec(index: number, count: number): EmberSpec {
  const n = count > 0 ? count : 1;
  const frac = index / n;
  // small deterministic hashes off the index for varied-but-stable values
  const wob = (Math.sin(index * 12.9898) + 1) / 2; // 0..1
  const wob2 = (Math.sin(index * 78.233) + 1) / 2; // 0..1
  return {
    sizePx: round(2.5 + wob * 2.5, 2),
    bottomPct: 29 + (index % 4) * 2,
    durationS: round(6.5 + wob2 * 3.5, 2),
    delayS: round(frac * STAGGER_SECONDS, 3),
    colorIndex: index % EMBER_COLORS,
  };
}

export function emberTransform(phase: number): {
  translateYvh: number;
  scale: number;
  opacity: number;
} {
  const p = clamp(phase, 0, 1);
  // fade in fast (first 10%), hold, fade out toward the top (reference emberRise)
  const opacity = p < 0.1 ? (p / 0.1) * 0.9 : 0.9 * (1 - (p - 0.1) / 0.9);
  return {
    translateYvh: -RISE_VH * p,
    scale: 1 - (1 - END_SCALE) * p,
    opacity: clamp(opacity, 0, 1),
  };
}
