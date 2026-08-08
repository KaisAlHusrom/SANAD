import { FLIGHT } from '../constants';
import type { FlightPlan } from '../types';

/**
 * Collapse a flight to its calm-mode form (WEB4): brief opacity-only fades, zero warp/FOV/
 * bank/ignition flourish, no streaks — essential feedback (the page IS changing) stays.
 * The `maxHold` failsafe is kept so a slow route still lands.
 */
export function reducePlan(plan: FlightPlan): FlightPlan {
  return {
    ...plan,
    departure: {
      duration: FLIGHT.REDUCED.departure,
      warpPeak: 0,
      bloomSurge: 1,
      fovKick: 0,
      ignition: 0,
      contentExit: 'fade',
    },
    cruise: {
      ...plan.cruise,
      minDuration: FLIGHT.REDUCED.cruiseMin,
      warp: 0,
      streakDensity: 0,
      paletteCurve: 'linear',
    },
    arrival: {
      duration: FLIGHT.REDUCED.arrival,
      decel: 'glide',
      contentEnter: 'fade',
    },
    path: { departBank: 0, arriveBank: 0, lateral: 0 },
  };
}
