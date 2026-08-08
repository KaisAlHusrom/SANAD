'use client';

import { useEffect, useRef, type RefObject } from 'react';
import { landingWorldOrder } from '@sanad/config';

/** One section's document geometry — where it starts and how tall it is (px). */
export interface SectionRect {
  readonly top: number;
  readonly height: number;
}

/** The page scroll geometry the planets need to place each world at its own section. */
export interface SectionMetrics {
  /** `scrollHeight − viewportHeight` — maps store `progress` back to a `scrollY`. */
  scrollable: number;
  viewport: number;
  rects: Record<string, SectionRect>;
}

/** Each world's section element: the hero + works own `id`s, chapters carry `data-chapter`. */
function selectorFor(id: string): string {
  if (id === 'hero') return '#hero';
  if (id === 'works') return '#works';
  return `[data-chapter="${id}"]`;
}

/**
 * Measures each section's real scroll geometry so a planet docks in sync with its own section (the
 * reference reads `el.offsetTop/offsetHeight` — this caches it, re-measuring on resize + layout
 * settle rather than every frame). Returns a live ref the R3F frame loop reads with zero allocation.
 */
export function useSectionMetrics(): RefObject<SectionMetrics> {
  const ref = useRef<SectionMetrics>({ scrollable: 1, viewport: 1, rects: {} });

  useEffect(() => {
    const measure = (): void => {
      const viewport = window.innerHeight;
      const scrollable = Math.max(
        1,
        document.documentElement.scrollHeight - viewport,
      );
      const rects: Record<string, SectionRect> = {};
      for (const id of landingWorldOrder) {
        const el = document.querySelector<HTMLElement>(selectorFor(id));
        if (el) rects[id] = { top: el.offsetTop, height: el.offsetHeight };
      }
      ref.current = { scrollable, viewport, rects };
    };

    measure();
    // layout settles after mount (fonts, images, GSAP pin-spacers) — re-measure a couple of times
    const settle1 = window.setTimeout(measure, 400);
    const settle2 = window.setTimeout(measure, 1600);
    window.addEventListener('resize', measure);
    const observer = new ResizeObserver(measure);
    observer.observe(document.documentElement);

    return () => {
      window.clearTimeout(settle1);
      window.clearTimeout(settle2);
      window.removeEventListener('resize', measure);
      observer.disconnect();
    };
  }, []);

  return ref;
}
