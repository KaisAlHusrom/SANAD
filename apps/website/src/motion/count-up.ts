/**
 * Pure easing for the stats counters. `countUpValue(target, t)` maps progress `t` (0→1) to an
 * eased integer between 0 and `target` (ease-out cubic — fast then settling). Reduced-motion
 * callers skip the animation and render `target` directly (WEB4); this keeps the math testable
 * and frame-independent.
 */
export function countUpValue(target: number, t: number): number {
  const clamped = t <= 0 ? 0 : t >= 1 ? 1 : t;
  const eased = 1 - Math.pow(1 - clamped, 3);
  return Math.round(target * eased);
}
