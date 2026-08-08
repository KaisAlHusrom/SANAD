import { smoothstep } from '../../cosmos/math';
import { FLIGHT } from '../constants';
import type { FlightPhase, FlightPlan } from '../types';

/**
 * The flight's warp envelope: ramp to the departure peak, hand over to the sustained cruise
 * warp across the leading `CRUISE_WARP_BLEND` slice (no jump at the boundary), decay to 0
 * through arrival — the deceleration IS the arrival show.
 */
export function travelWarp(
  phase: FlightPhase,
  t: number,
  plan: FlightPlan,
): number {
  if (phase === 'departure')
    return smoothstep(0, 1, t) * plan.departure.warpPeak;
  if (phase === 'cruise') {
    const blend = Math.min(t / FLIGHT.CRUISE_WARP_BLEND, 1);
    return (
      plan.departure.warpPeak +
      (plan.cruise.warp - plan.departure.warpPeak) * blend
    );
  }
  if (phase === 'arrival') return (1 - smoothstep(0, 1, t)) * plan.cruise.warp;
  return 0;
}

/**
 * Combine the landing's scroll-velocity warp with the travel warp — the stronger source
 * wins, so a flight igniting mid-scroll never dims an already-hot warp field.
 */
export function combinedWarp(scrollWarp: number, travel: number): number {
  return Math.max(scrollWarp, travel);
}
