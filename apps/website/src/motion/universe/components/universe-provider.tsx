'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { createFlightDirector } from '../director/flight-director';
import { FlightDirectorContext } from '../director/flight-director-context';
import { resolveSystem } from '../math/resolve-system';

/**
 * Creates THE flight director once for the whole site (P8.D) and provides it below the
 * locale layout. The initial system is resolved synchronously from the first pathname so a
 * direct load / refresh idles in the right star system with no flight. Keeps the director's
 * reduced-motion flag live against the OS media query (WEB4) — the director collapses any
 * flight to a brief opacity veil while it's set.
 */
export function UniverseProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [director] = useState(() => {
    const resolved = resolveSystem(pathname ?? '/');
    return createFlightDirector({
      initialSystem: resolved.system,
      initialSlug: resolved.slug,
    });
  });

  useEffect(() => {
    if (typeof window.matchMedia !== 'function') return undefined;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    director.setReducedMotion(query.matches);
    const onChange = (event: MediaQueryListEvent) =>
      director.setReducedMotion(event.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [director]);

  return (
    <FlightDirectorContext.Provider value={director}>
      {children}
    </FlightDirectorContext.Provider>
  );
}
