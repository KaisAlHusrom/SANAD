'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import type { ProcessStepView } from '@sanad/web-ui';
import { prefersReducedMotion } from '../../../motion/reduced-motion';
import {
  procActiveFloat,
  procActiveIndex,
  procCardReveal,
  procDock,
  procMoon,
} from '../../../motion/cosmos/math';

/**
 * The process "phases as moons" system (WEB10, reference `updateProcessOrbit`) — the LIVE `System`
 * injected into the shared `@sanad/web-ui` `ProcessSection` (P8.5 live-swap #2). Four moons orbit the
 * docked process planet on an ellipse; the active phase rides to the top and enlarges, and **its step
 * card cross-fades in — one at a time** (a stacked deck, not a 4-up grid) with a "NN / NN" counter.
 * Everything is gated by the dock so it fades in only once the world arrives and out as it leaves,
 * driven by the process chapter's own scroll (its GSAP ScrollTrigger). Under reduced-motion it settles
 * to the first card, static (WEB4). Transform/opacity only, 60fps. Renders the shared `.web-process-*`
 * classes (web-ui.css) so the live cards are byte-identical to the admin preview's static cards.
 */
export function ProcessMoons({ steps }: { steps: ProcessStepView[] }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const trackFillRef = useRef<HTMLDivElement>(null);
  const moonRefs = useRef<Array<HTMLDivElement | null>>([]);
  const cardRefs = useRef<Array<HTMLElement | null>>([]);
  const n = steps.length;

  useEffect(() => {
    const chapter = rootRef.current?.closest('.lp-chapter');
    const rx = () => Math.min(window.innerWidth * 0.3, 320);
    const stepLabel = (active: number) =>
      `${String(active + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;

    const render = (local: number) => {
      const dock = procDock(local);
      const af = procActiveFloat(local, n);
      const active = procActiveIndex(af, n);
      const orx = rx();
      const ory = orx * 0.42;
      if (ringRef.current) ringRef.current.style.opacity = dock.toFixed(3);
      for (let i = 0; i < n; i++) {
        const moon = moonRefs.current[i];
        if (moon) {
          const p = procMoon(i, n, af, orx, ory, 40, dock);
          moon.style.transform = `translate(calc(-50% * var(--dir, 1)), -50%) translate(${p.x.toFixed(
            1,
          )}px, ${p.y.toFixed(1)}px) scale(${p.scale.toFixed(3)})`;
          moon.style.opacity = p.opacity.toFixed(3);
          moon.style.zIndex = String(p.z);
          moon.classList.toggle('is-active', p.active);
        }
        const card = cardRefs.current[i];
        if (card) {
          const cr = procCardReveal(i, af, dock);
          card.style.opacity = cr.opacity.toFixed(3);
          card.style.transform = `translateY(${cr.translateY.toFixed(1)}px)`;
        }
      }
      if (stepRef.current) {
        stepRef.current.style.opacity = dock.toFixed(3);
        stepRef.current.textContent = stepLabel(active);
      }
      // the 4-stop flight track fills as the journey rides moon to moon
      if (trackRef.current) trackRef.current.style.opacity = dock.toFixed(3);
      if (trackFillRef.current) {
        const fill = n > 1 ? af / (n - 1) : 1;
        trackFillRef.current.style.transform = `scaleX(${fill.toFixed(3)})`;
      }
    };

    if (prefersReducedMotion() || !chapter) {
      if (ringRef.current) ringRef.current.style.opacity = '0';
      moonRefs.current.forEach((moon) => moon && (moon.style.opacity = '0'));
      cardRefs.current.forEach(
        (card, i) => card && (card.style.opacity = i === 0 ? '1' : '0'),
      );
      if (stepRef.current) stepRef.current.style.opacity = '1';
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    render(0);
    const trigger = ScrollTrigger.create({
      trigger: chapter,
      start: 'top top',
      end: 'bottom bottom',
      scrub: true,
      onUpdate: (self) => render(self.progress),
    });
    return () => trigger.kill();
  }, [n]);

  return (
    <div ref={rootRef} className="web-process-system">
      <div ref={ringRef} className="web-process-ring" aria-hidden="true" />
      {steps.map((step, i) => (
        <div
          key={`moon-${step.id}`}
          ref={(el) => {
            moonRefs.current[i] = el;
          }}
          className={`web-process-moon web-process-moon--${i % 4}`}
          aria-hidden="true"
        />
      ))}
      {/* mono instrument readout — LTR-isolated so RTL bidi can't reorder "03 / 04" (WEB6) */}
      <div
        ref={stepRef}
        className="web-process-step web-ltr"
        aria-hidden="true"
      >
        {`01 / ${String(n).padStart(2, '0')}`}
      </div>
      <div ref={trackRef} className="web-process-track" aria-hidden="true">
        <div ref={trackFillRef} className="web-process-track-fill" />
        {steps.map((step, i) => (
          <span
            key={`stop-${step.id}`}
            className="web-process-track-stop"
            // stop position along the track — runtime geometry from the step count (U6 carve-out)
            style={{
              insetInlineStart:
                n > 1 ? `${((i / (n - 1)) * 100).toFixed(1)}%` : '50%',
            }}
          />
        ))}
      </div>
      {/* the same `.web-process-card*` DOM the shared ProcessSection renders statically (preview===live) */}
      <div className="web-process-cards">
        {steps.map((step, i) => (
          <article
            key={step.id}
            ref={(el) => {
              cardRefs.current[i] = el;
            }}
            className={`web-process-card web-phase--${i % 4}`}
          >
            <div className="web-process-card-meta">
              <span className="web-ltr">{step.label}</span>
              {step.duration ? (
                <span className="web-process-card-meta-dur">
                  {step.duration}
                </span>
              ) : null}
            </div>
            <h3 className="web-process-card-title">{step.title}</h3>
            <p className="web-process-card-body">{step.body}</p>
            {step.deliverables.length > 0 ? (
              <ul className="web-process-card-give" aria-label={step.giveLabel}>
                {step.deliverables.map((item, di) => (
                  <li
                    key={`${step.id}-give-${di}`}
                    className="web-process-card-give-item"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
        ))}
      </div>
    </div>
  );
}
