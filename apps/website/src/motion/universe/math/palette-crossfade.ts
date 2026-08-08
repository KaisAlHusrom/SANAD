import { smoothstep } from '../../cosmos/math';
import { FLIGHT } from '../constants';
import type { FlightPhase, FlightPlan } from '../types';

/**
 * The from→to space-tint crossfade progress (0 = origin tint, 1 = destination tint).
 * Departure carries the leading `PALETTE_DEPART_SHARE`; a real cruise finishes the fade by
 * its end (long route-waits sit fully in the destination's tint); an intra hop (no cruise)
 * finishes inside the leading `PALETTE_ARRIVAL_WINDOW` slice of its arrival — the tint never
 * snaps at a phase boundary.
 */
export function paletteMix(
  phase: FlightPhase,
  t: number,
  plan: FlightPlan,
): number {
  const share = FLIGHT.PALETTE_DEPART_SHARE;
  if (phase === 'departure') return smoothstep(0, 1, t) * share;
  if (phase === 'cruise') {
    if (plan.cruise.minDuration <= 0) return share;
    return share + smoothstep(0, 1, t) * (1 - share);
  }
  if (phase === 'arrival') {
    if (plan.cruise.minDuration <= 0) {
      const local = Math.min(t / FLIGHT.PALETTE_ARRIVAL_WINDOW, 1);
      return share + smoothstep(0, 1, local) * (1 - share);
    }
    return 1;
  }
  return 1;
}

/**
 * The mid-cruise plunge toward deep black for `mid-dip` palette curves — the felt void
 * between two systems. 0 everywhere except a sine hump across the cruise.
 */
export function voidDip(
  phase: FlightPhase,
  t: number,
  plan: FlightPlan,
): number {
  if (phase !== 'cruise' || plan.cruise.paletteCurve !== 'mid-dip') return 0;
  const clamped = Math.min(Math.max(t, 0), 1);
  return Math.sin(Math.PI * clamped) * FLIGHT.VOID_DIP;
}

/** Per-channel lerp of two color triplets (exact at both ends). */
export function mixTriplet(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  mix: number,
): [number, number, number] {
  const inv = 1 - mix;
  return [
    a[0] * inv + b[0] * mix,
    a[1] * inv + b[1] * mix,
    a[2] * inv + b[2] * mix,
  ];
}
