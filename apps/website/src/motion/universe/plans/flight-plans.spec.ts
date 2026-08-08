import { universeSystems } from '@sanad/config';
import { describe, expect, it } from 'vitest';
import { FLIGHT_PLANS } from './flight-plans';

const SYSTEM_IDS = Object.keys(universeSystems);

describe('FLIGHT_PLANS registry (P8.D directional route-pair choreography)', () => {
  it('keys every plan as from>to over real systems or the * wildcard', () => {
    for (const key of Object.keys(FLIGHT_PLANS)) {
      const [from, to] = key.split('>');
      expect(from, key).toBeTruthy();
      expect(to, key).toBeTruthy();
      for (const side of [from, to]) {
        expect(side === '*' || SYSTEM_IDS.includes(side as string), key).toBe(
          true,
        );
      }
    }
  });

  it('ships the named directional pairs the owner approved (both directions distinct)', () => {
    expect(FLIGHT_PLANS['landing>services']).toBeDefined();
    expect(FLIGHT_PLANS['services>landing']).toBeDefined();
    expect(FLIGHT_PLANS['services>serviceDetail']).toBeDefined();
    expect(FLIGHT_PLANS['serviceDetail>services']).toBeDefined();
    expect(FLIGHT_PLANS['serviceDetail>serviceDetail']).toBeDefined();
    expect(FLIGHT_PLANS['landing>contact']).toBeDefined();
    // P8.E-3 blog "Logbook": an inbound reading glide + an intra index↔post page turn
    expect(FLIGHT_PLANS['landing>blog']).toBeDefined();
    expect(FLIGHT_PLANS['blog>blog']?.kind).toBe('intra');
    // P8.E-5 request "Launchpad": the flagship ignition outbound + a consistent launch from anywhere
    expect(FLIGHT_PLANS['landing>request']?.kind).toBe('inter');
    expect(FLIGHT_PLANS['*>request']).toBeDefined();
    // the flagship conversion flight gets the grand ceremony — full warp + a strong bloom surge
    expect(FLIGHT_PLANS['landing>request']?.departure.warpPeak).toBe(1);
    expect(
      FLIGHT_PLANS['landing>request']?.departure.bloomSurge ?? 0,
    ).toBeGreaterThanOrEqual(1.3);
    expect(FLIGHT_PLANS['*>landing']).toBeDefined();
    expect(FLIGHT_PLANS['*>*']).toBeDefined();
    // outbound ≠ return: the two directions are genuinely different choreographies
    const out = FLIGHT_PLANS['landing>services'];
    const back = FLIGHT_PLANS['services>landing'];
    expect(out?.departure.contentExit).not.toBe(back?.departure.contentExit);
    expect(out?.arrival.decel).not.toBe(back?.arrival.decel);
    expect(Math.sign(out?.path.departBank ?? 0)).not.toBe(
      Math.sign(back?.path.departBank ?? 0),
    );
  });

  it('gives intra-system hops no warp tunnel (cruise min 0) and inter flights a real cruise', () => {
    expect(FLIGHT_PLANS['services>serviceDetail']?.cruise.minDuration).toBe(0);
    expect(FLIGHT_PLANS['serviceDetail>services']?.cruise.minDuration).toBe(0);
    expect(
      FLIGHT_PLANS['landing>services']?.cruise.minDuration ?? 0,
    ).toBeGreaterThanOrEqual(600);
    expect(FLIGHT_PLANS['landing>services']?.departure.warpPeak).toBe(1);
    expect(
      FLIGHT_PLANS['services>serviceDetail']?.departure.warpPeak ?? 1,
    ).toBeLessThan(0.5);
  });

  it('keeps every plan physically sane (positive durations, 0..1 factors, a real maxHold)', () => {
    for (const [key, plan] of Object.entries(FLIGHT_PLANS)) {
      expect(plan.id, key).toBe(key);
      expect(plan.departure.duration, key).toBeGreaterThanOrEqual(0);
      expect(plan.arrival.duration, key).toBeGreaterThan(0);
      expect(plan.cruise.maxHold, key).toBeGreaterThan(plan.cruise.minDuration);
      for (const v of [
        plan.departure.warpPeak,
        plan.departure.ignition,
        plan.cruise.warp,
        plan.cruise.streakDensity,
        plan.path.lateral,
      ]) {
        expect(v, key).toBeGreaterThanOrEqual(0);
        expect(v, key).toBeLessThanOrEqual(1);
      }
      expect(plan.departure.bloomSurge, key).toBeGreaterThanOrEqual(1);
    }
  });
});
