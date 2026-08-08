import { describe, expect, it } from 'vitest';
import { FLIGHT } from '../constants';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import { reducePlan } from './reduce-plan';

describe('reducePlan (WEB4 — a flight under prefers-reduced-motion is a brief opacity veil)', () => {
  const base = FLIGHT_PLANS['landing>services'];
  if (!base) throw new Error('missing base plan');
  const reduced = reducePlan(base);

  it('collapses every duration to the calm-mode constants', () => {
    expect(reduced.departure.duration).toBe(FLIGHT.REDUCED.departure);
    expect(reduced.cruise.minDuration).toBe(FLIGHT.REDUCED.cruiseMin);
    expect(reduced.arrival.duration).toBe(FLIGHT.REDUCED.arrival);
  });

  it('kills all motion flourishes — opacity only', () => {
    expect(reduced.departure.warpPeak).toBe(0);
    expect(reduced.departure.fovKick).toBe(0);
    expect(reduced.departure.ignition).toBe(0);
    expect(reduced.departure.bloomSurge).toBe(1);
    expect(reduced.cruise.warp).toBe(0);
    expect(reduced.cruise.streakDensity).toBe(0);
    expect(reduced.departure.contentExit).toBe('fade');
    expect(reduced.arrival.contentEnter).toBe('fade');
    expect(reduced.arrival.decel).toBe('glide');
    expect(reduced.path.departBank).toBe(0);
    expect(reduced.path.arriveBank).toBe(0);
    expect(reduced.path.lateral).toBe(0);
  });

  it('keeps the failsafe ceiling so a slow route still lands', () => {
    expect(reduced.cruise.maxHold).toBe(base.cruise.maxHold);
  });
});
