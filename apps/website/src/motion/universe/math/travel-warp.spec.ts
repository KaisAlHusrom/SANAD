import { describe, expect, it } from 'vitest';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import { combinedWarp, travelWarp } from './travel-warp';

const inter = FLIGHT_PLANS['landing>services'];
const intra = FLIGHT_PLANS['services>serviceDetail'];
if (!inter || !intra) throw new Error('missing plans');

describe('travelWarp (the flight warp envelope)', () => {
  it('is 0 at rest and ramps to the departure peak', () => {
    expect(travelWarp('idle', 0, inter)).toBe(0);
    expect(travelWarp('departure', 0, inter)).toBe(0);
    expect(travelWarp('departure', 1, inter)).toBeCloseTo(
      inter.departure.warpPeak,
      5,
    );
  });

  it('hands the peak over to the sustained cruise warp without a jump', () => {
    const endOfDeparture = travelWarp('departure', 1, inter);
    const startOfCruise = travelWarp('cruise', 0, inter);
    expect(Math.abs(endOfDeparture - startOfCruise)).toBeLessThan(0.001);
    expect(travelWarp('cruise', 1, inter)).toBeCloseTo(inter.cruise.warp, 5);
  });

  it('decays to 0 through arrival (the deceleration is the show)', () => {
    expect(travelWarp('arrival', 0, inter)).toBeCloseTo(inter.cruise.warp, 5);
    expect(travelWarp('arrival', 1, inter)).toBe(0);
    const mid = travelWarp('arrival', 0.5, inter);
    expect(mid).toBeGreaterThan(0);
    expect(mid).toBeLessThan(inter.cruise.warp);
  });

  it('keeps an intra hop gentle — no tunnel spike', () => {
    expect(travelWarp('departure', 1, intra)).toBeLessThan(0.5);
    expect(travelWarp('cruise', 1, intra)).toBeCloseTo(intra.cruise.warp, 5);
  });
});

describe('combinedWarp', () => {
  it('lets the stronger source win so scroll warp and travel warp never fight', () => {
    expect(combinedWarp(0.3, 0.8)).toBe(0.8);
    expect(combinedWarp(0.9, 0.2)).toBe(0.9);
    expect(combinedWarp(0, 0)).toBe(0);
  });
});
