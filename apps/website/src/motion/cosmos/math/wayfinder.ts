/**
 * The constellation wayfinder's station tracker (8.B-4 Stage 5a) — which of the nine journey
 * stations the viewport centre is currently inside. Works on the **measured** section tops (the
 * chapters are tall docking stages and the works pin's span varies with card count, so even-spacing
 * assumptions are wrong): a station is active from the moment the centre passes its top until the
 * next one's top. Pure; the rail measures tops on mount/resize and calls this per scroll.
 */
export function activeSectionIndex(
  scrollCenter: number,
  tops: readonly number[],
): number {
  let active = 0;
  for (let i = 0; i < tops.length; i++) {
    const top = tops[i];
    if (top !== undefined && scrollCenter >= top) active = i;
  }
  return active;
}
