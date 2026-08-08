import { clamp } from '../cosmos/math/smoothstep';

/**
 * A sticky "chapter" section's own progress (0→1) from the window scroll: 0 the instant its sticky
 * stage pins at the top of the viewport, 1 when it releases (after `sectionHeight − viewportHeight`
 * of travel). Pure/testable — the `ChapterStage` and the moon/works overlays read it to drive
 * arrival-from-depth and orbit timing. If a section is shorter than the viewport it snaps 0→1 at
 * its top (degenerate case, no divide-by-zero).
 */
export function localProgress(
  scrollY: number,
  sectionTop: number,
  sectionHeight: number,
  viewportHeight: number,
): number {
  const scrollable = sectionHeight - viewportHeight;
  if (scrollable <= 0) return scrollY >= sectionTop ? 1 : 0;
  return clamp((scrollY - sectionTop) / scrollable, 0, 1);
}
