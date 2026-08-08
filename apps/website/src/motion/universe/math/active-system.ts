import type { FlightState, ResolvedSystem } from '../types';

/**
 * Which system's scene should be MOUNTED for a flight state: the origin while departing
 * (its worlds recede behind the ignition), the destination from the cruise on (it preloads
 * under the tunnel and receives the arrival), the resting system when idle.
 */
export function activeSystem(state: FlightState): ResolvedSystem {
  if (state.phase === 'idle') {
    return { system: state.currentSystem, slug: state.currentSlug };
  }
  if (state.phase === 'departure') {
    return {
      system: state.from ?? state.currentSystem,
      slug: state.currentSlug,
    };
  }
  return { system: state.to ?? state.currentSystem, slug: state.toSlug };
}
