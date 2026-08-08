import { FLIGHT } from '../constants';
import type { FlightState, SystemId } from '../types';

/** A clean at-rest state, idling in `currentSystem`. */
export function createIdleFlightState(
  currentSystem: SystemId,
  currentSlug: string | null = null,
  reducedMotion = false,
): FlightState {
  return {
    phase: 'idle',
    t: 0,
    phaseElapsed: 0,
    from: null,
    to: null,
    toSlug: null,
    plan: null,
    pendingHref: null,
    routeReady: false,
    skipping: false,
    reducedMotion,
    currentSystem,
    currentSlug,
  };
}

/** Phase-local progress; a zero/negative duration is instantly complete. */
function phaseT(elapsed: number, duration: number): number {
  if (duration <= 0) return 1;
  return Math.min(elapsed / duration, 1);
}

/**
 * The pure state-machine core (P8.D): advance a flight by `dtMs`.
 * `idle → departure → cruise → arrival → idle`; the cruise gate is
 * `(minDuration elapsed OR skipping) AND routeReady`, with the `maxHold` failsafe so an
 * error page can never trap the traveler mid-tunnel. Returns the SAME reference at idle
 * (zero per-frame work at rest); side effects (router push, scene mounts) live with the
 * director's phase-entry notifications, never here.
 */
export function stepFlightPhases(
  state: FlightState,
  dtMs: number,
): FlightState {
  const plan = state.plan;
  if (state.phase === 'idle' || !plan) return state;
  const dt = dtMs * (state.skipping ? FLIGHT.SKIP_SPEED : 1);
  const elapsed = state.phaseElapsed + dt;

  if (state.phase === 'departure') {
    const t = phaseT(elapsed, plan.departure.duration);
    if (t >= 1) {
      return {
        ...state,
        phase: 'cruise',
        phaseElapsed: 0,
        t: phaseT(0, plan.cruise.minDuration),
      };
    }
    return { ...state, phaseElapsed: elapsed, t };
  }

  if (state.phase === 'cruise') {
    const minMet = state.skipping || elapsed >= plan.cruise.minDuration;
    const arrive =
      (minMet && state.routeReady) || elapsed >= plan.cruise.maxHold;
    if (arrive) return { ...state, phase: 'arrival', phaseElapsed: 0, t: 0 };
    return {
      ...state,
      phaseElapsed: elapsed,
      t: phaseT(elapsed, plan.cruise.minDuration),
    };
  }

  // arrival
  const t = phaseT(elapsed, plan.arrival.duration);
  if (t >= 1) {
    return createIdleFlightState(
      state.to ?? state.currentSystem,
      state.toSlug,
      state.reducedMotion,
    );
  }
  return { ...state, phaseElapsed: elapsed, t };
}
