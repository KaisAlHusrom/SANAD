'use client';

import { useEffect, useRef, type ReactNode } from 'react';
import { travelContent } from '../math/travel-content';
import { useFlightDirector } from '../hooks/use-flight-director';
import type { FlightState } from '../types';

/** Round to a short stable precision (the WEB inline-style hydration rule discipline). */
function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * Wraps the routed page content and choreographs its exit/enter around a flight (P8.D):
 * a plain box that SSRs as `data-travel-phase="idle"` (hydration-stable, content visible)
 * and, ONLY while the director is flying, carries the phase + the plan's exit/enter style
 * and the eased `--travel-out`/`--travel-in` progress vars that `universe.css` animates
 * (transform/opacity only). Driven by the director's own clock via subscribe — zero React
 * re-renders per frame. During the cruise the stage is hard-hidden, so the streamed-in new
 * page (and `loading.tsx`) can never flash before its arrival.
 */
export function PageStage({ children }: { children: ReactNode }) {
  const director = useFlightDirector();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!director || !el) return undefined;

    const apply = (state: FlightState) => {
      el.dataset.travelPhase = state.phase;
      if (state.phase === 'idle' || !state.plan) {
        el.style.removeProperty('--travel-out');
        el.style.removeProperty('--travel-in');
        delete el.dataset.travelExit;
        delete el.dataset.travelEnter;
        return;
      }
      const pose = travelContent(state.phase, state.t);
      el.style.setProperty('--travel-out', String(round3(pose.out)));
      el.style.setProperty('--travel-in', String(round3(pose.in)));
      el.dataset.travelExit = state.plan.departure.contentExit;
      el.dataset.travelEnter = state.plan.arrival.contentEnter;
    };

    apply(director.getState());
    return director.subscribe(apply);
  }, [director]);

  return (
    <div ref={ref} className="page-stage" data-travel-phase="idle">
      {children}
    </div>
  );
}
