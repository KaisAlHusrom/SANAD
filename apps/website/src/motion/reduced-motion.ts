/**
 * Read the OS "reduce motion" preference (WEB4). Used to gate the speed-capped smooth scroll, the
 * ink cursor, parallax, and the count-up — canvas/scroll effects don't auto-respect the setting, so
 * we check it ourselves. SSR/non-jsdom-safe (returns `false` when `matchMedia` is absent).
 */
export function prefersReducedMotion(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** True on coarse-pointer / touch devices — the ink cursor is desktop-only. */
export function isTouchDevice(): boolean {
  if (
    typeof window === 'undefined' ||
    typeof window.matchMedia !== 'function'
  ) {
    return false;
  }
  return window.matchMedia('(pointer: coarse)').matches;
}
