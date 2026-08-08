import { describe, expect, it } from 'vitest';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import type { FlightState } from '../types';
import { createIdleFlightState, stepFlightPhases } from './flight-phases';

const plan = FLIGHT_PLANS['landing>services'];
if (!plan) throw new Error('missing plan');

/** A flight just departed landing→services (matches what the director writes). */
function departed(overrides: Partial<FlightState> = {}): FlightState {
  return {
    ...createIdleFlightState('landing'),
    phase: 'departure',
    from: 'landing',
    to: 'services',
    plan,
    pendingHref: '/ar/services',
    ...overrides,
  };
}

describe('stepFlightPhases (the pure state-machine core)', () => {
  it('leaves idle untouched (same reference — zero work per frame at rest)', () => {
    const idle = createIdleFlightState('landing');
    expect(stepFlightPhases(idle, 16)).toBe(idle);
  });

  it('advances departure t against the plan duration', () => {
    const s = stepFlightPhases(departed(), 325);
    expect(s.phase).toBe('departure');
    expect(s.t).toBeCloseTo(325 / plan.departure.duration, 5);
  });

  it('enters cruise when departure completes', () => {
    const s = stepFlightPhases(departed(), plan.departure.duration + 1);
    expect(s.phase).toBe('cruise');
    expect(s.phaseElapsed).toBe(0);
  });

  it('holds cruise until BOTH the minimum has elapsed AND the route is ready', () => {
    let s = stepFlightPhases(departed(), plan.departure.duration + 1);
    // route ready immediately, but the minimum must still elapse (the tunnel is the show)
    s = stepFlightPhases(
      { ...s, routeReady: true },
      plan.cruise.minDuration / 2,
    );
    expect(s.phase).toBe('cruise');
    s = stepFlightPhases(s, plan.cruise.minDuration);
    expect(s.phase).toBe('arrival');
  });

  it('keeps cruising past the minimum while the route is NOT ready', () => {
    let s = stepFlightPhases(departed(), plan.departure.duration + 1);
    s = stepFlightPhases(s, plan.cruise.minDuration + 500);
    expect(s.phase).toBe('cruise');
  });

  it('force-arrives at maxHold so an error page can never trap the veil (failsafe)', () => {
    let s = stepFlightPhases(departed(), plan.departure.duration + 1);
    for (let i = 0; i < 50 && s.phase === 'cruise'; i += 1) {
      s = stepFlightPhases(s, 100);
    }
    expect(s.phase).toBe('arrival');
  });

  it('completes arrival into a clean idle in the destination system', () => {
    let s = departed({ phase: 'arrival', routeReady: true, toSlug: null });
    s = stepFlightPhases(s, plan.arrival.duration + 1);
    expect(s.phase).toBe('idle');
    expect(s.currentSystem).toBe('services');
    expect(s.plan).toBeNull();
    expect(s.pendingHref).toBeNull();
    expect(s.routeReady).toBe(false);
    expect(s.skipping).toBe(false);
    expect(s.t).toBe(0);
  });

  it('fast-forwards while skipping (Escape / click during flight)', () => {
    const normal = stepFlightPhases(departed(), 100);
    const skipped = stepFlightPhases(departed({ skipping: true }), 100);
    expect(skipped.t).toBeGreaterThan(normal.t * 2);
  });

  it('waives the cruise minimum while skipping — but still waits for the route', () => {
    let s = stepFlightPhases(
      departed({ skipping: true }),
      plan.departure.duration * 3,
    );
    expect(s.phase).toBe('cruise');
    s = stepFlightPhases(s, 16);
    expect(s.phase).toBe('cruise'); // route not ready — cannot arrive into nothing
    s = stepFlightPhases({ ...s, routeReady: true }, 16);
    expect(s.phase).toBe('arrival');
  });

  it('treats a zero-duration departure (recovery flight) as instantly complete', () => {
    const recovery = departed({
      plan: { ...plan, departure: { ...plan.departure, duration: 0 } },
    });
    const s = stepFlightPhases(recovery, 16);
    expect(s.phase).toBe('cruise');
  });
});
