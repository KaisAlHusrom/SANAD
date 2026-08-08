'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  ConstellationFigure,
  constellationDraw,
  starReveal,
  type TrustDomain,
} from '@sanad/web-ui';
import { prefersReducedMotion } from '../../../motion/reduced-motion';

/**
 * The website's LIVE trust constellation — the injected `Constellation` for the shared
 * `TrustSection` (`mode='live'`). It renders the SAME shared `ConstellationFigure` DOM (single
 * source, byte-identical to the admin preview) and layers the scroll-linked motion on top: its own
 * ScrollTrigger (same pattern as ProcessMoons) traces the hairline links and pops each star as the
 * tracing reaches it, gated to the docked world — driven by SELECTOR over the already-rendered
 * figure (`[data-const-line]`/`[data-const-star]`/`[data-const-label]`, in document = domain order)
 * so no figure DOM is duplicated. Reduced-motion / no-JS keep the SSR figure fully drawn (SEO).
 */
export function TrustConstellation({ domains }: { domains: TrustDomain[] }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    const chapter = root?.closest('.lp-chapter');
    if (!root || prefersReducedMotion() || !chapter) return; // SSR markup is fully drawn already

    const lines = [
      ...root.querySelectorAll<SVGLineElement>('[data-const-line]'),
    ];
    const stars = [...root.querySelectorAll<SVGGElement>('[data-const-star]')];
    const labels = [
      ...root.querySelectorAll<HTMLElement>('[data-const-label]'),
    ];
    const n = stars.length;
    if (n === 0) return;

    const render = (local: number) => {
      const draw = constellationDraw(local);
      for (const line of lines) line.style.strokeDashoffset = String(1 - draw);
      for (let i = 0; i < n; i++) {
        const pop = starReveal(i, n, draw).toFixed(3);
        const star = stars[i];
        const label = labels[i];
        if (star) star.style.opacity = pop;
        if (label) label.style.opacity = pop;
      }
    };

    gsap.registerPlugin(ScrollTrigger);
    render(0);
    const trigger = ScrollTrigger.create({
      trigger: chapter,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => render(self.progress),
    });
    render(trigger.progress); // sync to a restored / non-top scroll position
    return () => trigger.kill();
  }, [domains.length]);

  return (
    <div ref={rootRef} className="lp-trust-constellation-root">
      <ConstellationFigure domains={domains} />
    </div>
  );
}
