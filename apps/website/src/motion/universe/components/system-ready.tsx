'use client';

import { useEffect } from 'react';
import { useFlightDirector } from '../hooks/use-flight-director';
import type { SystemId } from '../types';

/**
 * The "this route's content is mounted" signal (P8.D) — rendered by every `SystemStage`.
 * In flight it releases the arrival gate (`markRouteReady`); at rest it re-syncs the
 * director's current system (direct load, locale switch). No-ops without a provider.
 */
export function SystemReady({
  system,
  slug = null,
}: {
  system: SystemId;
  slug?: string | null;
}) {
  const director = useFlightDirector();

  useEffect(() => {
    director?.markRouteReady({ system, slug });
  }, [director, system, slug]);

  return null;
}
