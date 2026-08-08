/**
 * The star field is world-fixed (the camera streams through it), so it barely turns — only the two
 * nearer layers drift a whisper on the **Y axis** at different speeds/directions for parallax; the
 * far layer and every X-axis spin are gone (the old both-axis counter-swirl read as "annoying"). Calm/
 * reduced-motion holds everything still (WEB4). `t` is the rAF clock (N3 — passed in). Pure/testable.
 */
export function layerRotation(
  t: number,
  layerIndex: number,
  calm: boolean,
): number {
  if (calm) return 0;
  if (layerIndex === 1) return -t * 0.01;
  if (layerIndex === 2) return t * 0.02;
  return 0;
}
