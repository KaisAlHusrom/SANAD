'use client';

import { useEffect, useRef } from 'react';
import { pageAccents, universeSystems } from '@sanad/config';
import { travelContent } from '../math/travel-content';
import { useFlightDirector } from '../hooks/use-flight-director';
import type { FlightState } from '../types';

/**
 * The atmosphere of a flight in the DOM (P8.D): a fixed accent-tinted wash that rises with
 * departure, holds through the cruise and releases on arrival, crossfading from the origin
 * system's light to the destination's. On mobile/reduced-motion (no WebGL) this IS the whole
 * travel effect over the static fallback; with the canvas alive, `universe.css` slims it to
 * an edge vignette so the warp itself stays the show. Subscribe-driven — no React re-renders.
 */
export function TravelVeil() {
  const director = useFlightDirector();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!director || !el) return undefined;

    const apply = (state: FlightState) => {
      if (state.phase === 'idle' || !state.plan) {
        el.style.setProperty('--veil-o', '0');
        return;
      }
      const pose = travelContent(state.phase, state.t);
      const intensity = state.phase === 'arrival' ? 1 - pose.in : pose.out;
      el.style.setProperty(
        '--veil-o',
        String(Math.round(intensity * 1000) / 1000),
      );
      const from = state.from ?? state.currentSystem;
      const to = state.to ?? state.currentSystem;
      el.style.setProperty(
        '--veil-from',
        pageAccents[universeSystems[from].accent].accent,
      );
      el.style.setProperty(
        '--veil-to',
        pageAccents[universeSystems[to].accent].accent,
      );
    };

    apply(director.getState());
    return director.subscribe(apply);
  }, [director]);

  return <div ref={ref} className="travel-veil" aria-hidden="true" />;
}
