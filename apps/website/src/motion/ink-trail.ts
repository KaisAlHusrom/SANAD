/**
 * The ink-cursor thread's response to interactive targets (8.B-4 Stage 4c) — over a link/button the
 * thread **tightens and brightens** (narrower taper, hotter alpha): our own signature acknowledgement,
 * deliberately not a morphing/magnetic cursor (WEB9). Pure: `t` is the 0→1 taper position along the
 * trail, `hover` the smoothed 0→1 hover factor the canvas lerps each frame.
 */
export function inkTrailStyle(
  t: number,
  hover: number,
): { alpha: number; width: number } {
  const h = Math.max(0, Math.min(1, hover));
  return {
    alpha: Math.min(1, t * 0.5 * (1 + 0.7 * h)),
    width: t * 3 * (1 - 0.45 * h),
  };
}
