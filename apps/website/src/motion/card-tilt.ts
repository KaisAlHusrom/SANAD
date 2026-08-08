/**
 * The front works-card pointer tilt (8.B-4 Stage 4a) — the card leans toward the cursor like a held
 * instrument, never past ±{@link MAX_TILT_DEG}°. Pure: the component feeds pointer + rect in and
 * writes the returned degrees to a transform (a genuine runtime value, U6 carve-out). Physical
 * rotation axes are direction-agnostic, so RTL needs no flip (WEB6 — the lean follows the pointer
 * itself). Reduced motion never calls this (WEB4).
 */

const MAX_TILT_DEG = 6;

/** Pointer position normalized to the card: centre (0,0), edges ±1, clamped past the edges. */
export function normalizedInCard(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
): { nx: number; ny: number } {
  if (rect.width <= 0 || rect.height <= 0) return { nx: 0, ny: 0 };
  const nx = ((clientX - rect.left) / rect.width) * 2 - 1;
  const ny = ((clientY - rect.top) / rect.height) * 2 - 1;
  return {
    nx: Math.max(-1, Math.min(1, nx)),
    ny: Math.max(-1, Math.min(1, ny)),
  };
}

/** Tilt (deg) toward the normalized pointer — `rx` rocks on the horizontal axis, `ry` the vertical. */
export function cardTilt(nx: number, ny: number): { rx: number; ry: number } {
  const cx = Math.max(-1, Math.min(1, nx));
  const cy = Math.max(-1, Math.min(1, ny));
  // `|| 0` normalizes the −0 that `-cy` yields at the exact centre
  return { rx: (-cy || 0) * MAX_TILT_DEG, ry: cx * MAX_TILT_DEG };
}
