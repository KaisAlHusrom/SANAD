import { clamp, smoothstep } from './smoothstep';

/**
 * The footer "re-entry" reveal — as you scroll the tall 300vh impact section, the fixed footer
 * finale fades up from the crater. The raw scroll ratio through the impact section is clamped 0→1,
 * then only the last stretch (0.6→0.9) drives the reveal, so the footer stays hidden until you've
 * committed to the descent. Pure/testable; the footer sets its `opacity` from this.
 */
export function footerReveal(
  scrollY: number,
  impactTop: number,
  impactHeight: number,
  viewportHeight: number,
): number {
  const scrollable = impactHeight - viewportHeight;
  if (scrollable <= 0) return scrollY >= impactTop ? 1 : 0;
  const raw = clamp((scrollY - impactTop) / scrollable, 0, 1);
  return smoothstep(0.6, 0.9, raw);
}
