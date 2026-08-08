'use client';

import { useCallback, type MouseEvent } from 'react';
import { resolveSystem } from '../math/resolve-system';
import { useFlightDirector } from './use-flight-director';

/** Clicks that must fall through to the browser/Link default (new tab, external, hash…). */
function isDefaultNavigation(
  event: MouseEvent<HTMLAnchorElement>,
  href: string,
): boolean {
  return (
    event.defaultPrevented ||
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !href.startsWith('/')
  );
}

/**
 * The click side of a flight (P8.D, U5): resolve the destination system, ask the director to
 * depart, and — only if a flight actually starts — take over the navigation. The router push
 * itself happens at the departure→cruise boundary (`UniverseNavigator`), so the old page is
 * fully present for its exit choreography (Link's own viewport/hover prefetch means the RSC
 * payload is usually already streaming). A refused depart (same place / no director) leaves
 * Link's default client navigation untouched. Deliberately router-free so `TravelLink`
 * renders anywhere — including outside the App Router (component specs).
 */
export function useTravel() {
  const director = useFlightDirector();

  const travelTo = useCallback(
    (event: MouseEvent<HTMLAnchorElement>, href: string) => {
      if (!director || isDefaultNavigation(event, href)) return;
      const departed = director.depart({ href, to: resolveSystem(href) });
      if (!departed) return;
      event.preventDefault();
    },
    [director],
  );

  return { travelTo };
}
