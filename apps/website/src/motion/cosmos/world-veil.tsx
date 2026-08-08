'use client';

import { useEffect, useRef } from 'react';
import { useCosmosScrollStore } from '../scroll';
import { prefersReducedMotion } from '../reduced-motion';
import { worldColorAt } from './math';
import { WORLD_GLOWS } from './worlds';

/**
 * The world-veil (WEB10) — a fixed screen-blend wash that bathes the page in the current world's
 * light, brightest when a planet is docked and cross-fading to the next glow across a section
 * boundary. Sits between the cosmos canvas (z-1) and the content (z-10). Reads the scroll store each
 * frame and sets the gradient colour + opacity as runtime values (U6 carve-out). Under reduced-motion
 * it settles to a single soft wash at the hero glow (WEB4).
 */

/**
 * How strongly a planet is "present" at this scroll position — 1 at a world centre, 0 at a boundary.
 * The base triangle is **squared** to mimic the reference's real docked-planet presence (a sharp peak
 * at the dock), NOT a wide linear ramp: with the reference veil coefficients (`0.22 + 0.55·peak`) a
 * linear triangle keeps the wash high across most of a section and lifts deep space grey; squaring
 * pulls the wash tight to the dock so space between worlds stays near-black like the design.
 */
function presencePeak(progress: number, worldCount: number): number {
  if (worldCount < 2) return 1;
  const scaled = Math.min(Math.max(progress, 0), 1) * (worldCount - 1);
  const frac = scaled - Math.floor(scaled);
  const tri = 1 - 2 * Math.abs(frac - 0.5);
  return tri * tri;
}

export function WorldVeil() {
  const store = useCosmosScrollStore();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const paint = (progress: number, peak: number, cx: number, cy: number) => {
      const [r, g, b] = worldColorAt(progress, WORLD_GLOWS);
      const rgb = `${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)}`;
      // the reference veil geometry + coefficients (`Sanad Landing.dc.html:44` gradient,
      // `:1129` opacity `0.22 + 0.55·presence`). These were dialled down (0.08+0.26) while the r171
      // bloom hazed the frame grey; with the vendored r128 pass the bloom is bounded, so we restore
      // the design's full per-world wash — the light bath that ties each section to its planet.
      // 8.B-4 Stage 4d: the wash centre drifts ±3% with the cursor (the same parallax the camera
      // leans by), so the world's light subtly follows the visitor's attention. Physical screen
      // coords — direction-agnostic, no RTL flip needed (WEB6).
      const gx = (50 + cx * 3).toFixed(1);
      const gy = (50 + cy * 3).toFixed(1);
      el.style.background = `radial-gradient(62% 54% at ${gx}% ${gy}%, rgba(${rgb}, 0.14), transparent 72%)`;
      el.style.opacity = String(0.22 + peak * 0.55);
    };

    if (!store || prefersReducedMotion()) {
      paint(0, 0.5, 0, 0);
      return;
    }
    let raf = 0;
    const tick = () => {
      const s = store.getState();
      paint(
        s.progress,
        presencePeak(s.progress, WORLD_GLOWS.length),
        s.cursorX,
        s.cursorY,
      );
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [store]);

  return <div ref={ref} className="world-veil" aria-hidden="true" />;
}
