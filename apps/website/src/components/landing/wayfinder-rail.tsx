'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { activeSectionIndex } from '../../motion/cosmos/math';

export interface WayfinderStation {
  /** The section anchor id (`#hero` … `#cta`). */
  id: string;
  /** Short business label (from `LANDING_COPY.wayfinder`). */
  label: string;
  /** The station world's glow hex (from `landingWorlds`, U6) — the active dot's light. */
  glow: string;
}

/**
 * The constellation wayfinder (8.B-4 Stage 5a) — nine hairline-linked dots fixed at the inline-end
 * edge, one per journey station, the active one glowing in its world's colour with its business
 * label beside it. Real navigation for a nine-chapter page (restrained per the owner's no-telemetry
 * HUD precedent: dots + one word, nothing else). Anchor links ride the capped scroll's anchor glide
 * — scroll-linked, never jacked (WEB10). Tracks the **measured** section tops (chapters are tall
 * docking stages, the works pin varies), re-measured on resize. Logical inset ⇒ RTL-correct (WEB6);
 * hidden under 1024px (the rail assumes a desktop viewport); a plain `<nav>` of links for a11y.
 */
export function WayfinderRail({
  stations,
  ariaLabel,
}: {
  stations: WayfinderStation[];
  ariaLabel: string;
}) {
  const [active, setActive] = useState(0);
  const topsRef = useRef<number[]>([]);

  useEffect(() => {
    const measure = () => {
      topsRef.current = stations.map((s) => {
        const el = document.getElementById(s.id);
        return el ? el.getBoundingClientRect().top + window.scrollY : 0;
      });
    };
    let last = -1;
    const update = () => {
      const center = window.scrollY + window.innerHeight / 2;
      const idx = activeSectionIndex(center, topsRef.current);
      if (idx !== last) {
        last = idx;
        setActive(idx);
      }
    };
    const remeasure = () => {
      measure();
      update();
    };
    // measure after the chapters have applied their tall docking heights
    const settle = window.setTimeout(remeasure, 400);
    remeasure();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', remeasure);
    return () => {
      window.clearTimeout(settle);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', remeasure);
    };
  }, [stations]);

  return (
    <nav className="lp-wayfinder" aria-label={ariaLabel}>
      {stations.map((station, i) => (
        <a
          key={station.id}
          href={`#${station.id}`}
          className={`lp-way-dot${i === active ? ' is-active' : ''}`}
          // the station world's glow — a per-world token value resolved at render (U6)
          style={{ '--lp-way-glow': station.glow } as CSSProperties}
          aria-current={i === active ? 'true' : undefined}
        >
          <span className="lp-way-label">{station.label}</span>
        </a>
      ))}
    </nav>
  );
}
