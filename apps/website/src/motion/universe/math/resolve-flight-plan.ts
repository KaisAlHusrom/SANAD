import { FLIGHT } from '../constants';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import type { FlightPlan, ResolvedSystem } from '../types';

/**
 * Resolve the flight choreography for a directional pair (P8.D). Precedence:
 * exact `'from>to'` → `'from>*'` → `'*>to'` → `'*>*'`. Returns null for the same place
 * (same system AND same slug) — the caller falls back to a plain navigation.
 */
export function resolveFlightPlan(
  from: ResolvedSystem,
  to: ResolvedSystem,
  registry: Readonly<Record<string, FlightPlan>> = FLIGHT_PLANS,
): FlightPlan | null {
  if (from.system === to.system && from.slug === to.slug) return null;
  const keys = [
    `${from.system}>${to.system}`,
    `${from.system}>*`,
    `*>${to.system}`,
    '*>*',
  ];
  for (const key of keys) {
    const plan = registry[key];
    if (plan) return plan;
  }
  return null;
}

/**
 * Synthesize the back/forward (popstate) variant of a plan: the DOM has ALREADY swapped, so
 * there is nothing to depart from — the flight enters straight into a token cruise and plays
 * the plan's own arrival character into the restored page.
 */
export function makeRecoveryPlan(base: FlightPlan): FlightPlan {
  return {
    ...base,
    id: `recovery:${base.id}`,
    kind: 'recovery',
    departure: { ...base.departure, duration: 0 },
    cruise: { ...base.cruise, minDuration: FLIGHT.RECOVERY_CRUISE },
  };
}
