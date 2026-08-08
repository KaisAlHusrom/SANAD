import { clamp } from './smoothstep';

/**
 * Lateral fan for a grid of `[data-flow-grid]` cards: as a row arrives from depth its cards spread
 * apart, then collapse to their settled grid position at the chapter midpoint — so a row doesn't
 * pop in lockstep. Centre-symmetric; RTL flips the spread via `dir` (WEB6). Returns an inline-axis
 * px offset (0 when settled). Pure/testable.
 */

const SPREAD = 44; // max px a card leans out per column-step from centre

export function gridFan(
  index: number,
  count: number,
  local: number,
  dir: 1 | -1 = 1,
): number {
  const away = clamp(Math.abs(local - 0.5) * 2, 0, 1); // 0 settled, 1 at edges
  const centre = (count - 1) / 2;
  return (index - centre) * away * SPREAD * dir;
}
