import { describe, expect, it, vi } from 'vitest';
import { FLIGHT } from '../constants';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import type { ResolvedSystem } from '../types';
import { createFlightDirector, type FlightDirector } from './flight-director';

const plan = FLIGHT_PLANS['landing>services'];
if (!plan) throw new Error('missing plan');

const services: ResolvedSystem = { system: 'services', slug: null };
const contact: ResolvedSystem = { system: 'contact', slug: null };

/** A director with the rAF scheduler stubbed out — specs drive time via tick(). */
function makeDirector(): { d: FlightDirector; clock: { now: number } } {
  const d = createFlightDirector({
    initialSystem: 'landing',
    schedule: () => () => undefined,
  });
  const clock = { now: 0 };
  d.tick(clock.now); // baseline
  return { d, clock };
}

/**
 * Advance wall time in ~frame-sized steps — the director clamps a single tick's dt
 * (MAX_TICK_DT) and re-baselines its clock on each departure, exactly like real rAF.
 */
function fly(d: FlightDirector, clock: { now: number }, ms: number, step = 50) {
  const end = clock.now + ms;
  while (clock.now < end) {
    clock.now = Math.min(clock.now + step, end);
    d.tick(clock.now);
  }
}

describe('createFlightDirector', () => {
  it('idles in the initial system', () => {
    const { d } = makeDirector();
    expect(d.getState().phase).toBe('idle');
    expect(d.getState().currentSystem).toBe('landing');
  });

  it('departs with the resolved directional plan, from the current system', () => {
    const { d } = makeDirector();
    expect(d.depart({ href: '/ar/services', to: services })).toBe(true);
    const s = d.getState();
    expect(s.phase).toBe('departure');
    expect(s.from).toBe('landing');
    expect(s.to).toBe('services');
    expect(s.plan?.id).toBe('landing>services');
    expect(s.pendingHref).toBe('/ar/services');
  });

  it('refuses a flight to the same place (caller falls back to a plain push)', () => {
    const { d } = makeDirector();
    expect(
      d.depart({ href: '/ar', to: { system: 'landing', slug: null } }),
    ).toBe(false);
    expect(d.getState().phase).toBe('idle');
  });

  it('fires the cruise phase handler exactly once at the departure→cruise boundary', () => {
    const { d, clock } = makeDirector();
    const onCruise = vi.fn();
    d.onPhase('cruise', onCruise);
    d.depart({ href: '/ar/services', to: services });
    fly(d, clock, plan.departure.duration + 100);
    expect(d.getState().phase).toBe('cruise');
    expect(onCruise).toHaveBeenCalledTimes(1);
    fly(d, clock, 100);
    expect(onCruise).toHaveBeenCalledTimes(1);
  });

  it('completes the whole flight into idle-at-destination once the route is ready', () => {
    const { d, clock } = makeDirector();
    d.depart({ href: '/ar/services', to: services });
    fly(d, clock, plan.departure.duration + 100);
    d.markRouteReady(services);
    fly(d, clock, plan.cruise.minDuration + plan.arrival.duration + 500);
    const s = d.getState();
    expect(s.phase).toBe('idle');
    expect(s.currentSystem).toBe('services');
  });

  it('notifies subscribers while flying and stays silent at rest', () => {
    const { d, clock } = makeDirector();
    const listener = vi.fn();
    d.subscribe(listener);
    d.tick((clock.now += 10)); // idle — no notification
    expect(listener).not.toHaveBeenCalled();
    d.depart({ href: '/ar/services', to: services });
    fly(d, clock, 100);
    expect(listener).toHaveBeenCalled();
  });

  it('markRouteReady while idle just re-syncs the current system (direct load)', () => {
    const { d } = makeDirector();
    d.markRouteReady(contact);
    expect(d.getState().phase).toBe('idle');
    expect(d.getState().currentSystem).toBe('contact');
  });

  it('adopts the ACTUAL landed system when a flight resolves somewhere unexpected (404)', () => {
    const { d, clock } = makeDirector();
    d.depart({
      href: '/ar/services/nope',
      to: { system: 'serviceDetail', slug: 'nope' },
    });
    fly(d, clock, 1000);
    d.markRouteReady({ system: 'ambient', slug: null }); // notFound() rendered instead
    expect(d.getState().to).toBe('ambient');
    expect(d.getState().routeReady).toBe(true);
  });

  it('retargets mid-flight: from becomes the old destination, cruise restarts, push refires', () => {
    const { d, clock } = makeDirector();
    const onCruise = vi.fn();
    d.onPhase('cruise', onCruise);
    d.depart({ href: '/ar/services', to: services });
    fly(d, clock, plan.departure.duration + 100); // in cruise
    expect(onCruise).toHaveBeenCalledTimes(1);
    d.depart({ href: '/ar/contact', to: contact });
    const s = d.getState();
    expect(s.phase).toBe('cruise');
    expect(s.from).toBe('services');
    expect(s.to).toBe('contact');
    expect(s.pendingHref).toBe('/ar/contact');
    expect(s.routeReady).toBe(false);
    expect(onCruise).toHaveBeenCalledTimes(2); // the new href still gets its push
  });

  it('skip() fast-forwards the remaining flight', () => {
    const { d, clock } = makeDirector();
    d.depart({ href: '/ar/services', to: services });
    d.skip();
    // ~400ms of wall time at SKIP_SPEED covers the 650ms departure
    fly(d, clock, plan.departure.duration * 0.65);
    expect(d.getState().phase).toBe('cruise');
  });

  it('a recovery depart (popstate) never pushes and starts straight in the tunnel', () => {
    const { d, clock } = makeDirector();
    expect(
      d.depart({ href: '/ar/services', to: services, recovery: true }),
    ).toBe(true);
    expect(d.getState().pendingHref).toBeNull();
    d.tick((clock.now += 16));
    expect(d.getState().phase).toBe('cruise');
    expect(d.getState().plan?.kind).toBe('recovery');
  });

  it('reduced motion collapses the plan to the calm-mode durations (WEB4)', () => {
    const { d } = makeDirector();
    d.setReducedMotion(true);
    d.depart({ href: '/ar/services', to: services });
    const s = d.getState();
    expect(s.plan?.departure.duration).toBe(FLIGHT.REDUCED.departure);
    expect(s.plan?.departure.warpPeak).toBe(0);
    expect(s.reducedMotion).toBe(true);
  });

  it('clamps a huge frame gap (tab suspend) instead of teleporting the flight', () => {
    const { d, clock } = makeDirector();
    d.depart({ href: '/ar/services', to: services });
    d.tick((clock.now += 16)); // baseline after depart (dt 0)
    d.tick((clock.now += 60_000)); // one monster frame → clamped to MAX_TICK_DT
    expect(d.getState().phase).toBe('departure');
    expect(d.getState().phaseElapsed).toBeLessThanOrEqual(FLIGHT.MAX_TICK_DT);
  });
});
