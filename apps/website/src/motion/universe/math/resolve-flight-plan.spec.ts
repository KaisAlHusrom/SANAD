import { describe, expect, it } from 'vitest';
import { FLIGHT } from '../constants';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import type { ResolvedSystem } from '../types';
import { makeRecoveryPlan, resolveFlightPlan } from './resolve-flight-plan';

const at = (system: ResolvedSystem['system'], slug: string | null = null) => ({
  system,
  slug,
});

describe('resolveFlightPlan (directional pair → plan, exact → from>* → *>to → *>*)', () => {
  it('resolves an exact directional pair first', () => {
    expect(resolveFlightPlan(at('landing'), at('services'))?.id).toBe(
      'landing>services',
    );
    expect(resolveFlightPlan(at('services'), at('landing'))?.id).toBe(
      'services>landing',
    );
  });

  it('falls through the wildcard precedence for unlisted pairs', () => {
    // contact>landing has no exact entry → '*>landing'
    expect(resolveFlightPlan(at('contact'), at('landing'))?.id).toBe(
      '*>landing',
    );
    // ambient>contact has no exact/side entry → '*>*'
    expect(resolveFlightPlan(at('ambient'), at('contact'))?.id).toBe('*>*');
  });

  it('honors a from>* entry before *>to when one exists', () => {
    const registry = {
      ...FLIGHT_PLANS,
      'contact>*': { ...FLIGHT_PLANS['*>*'], id: 'contact>*' },
    };
    expect(resolveFlightPlan(at('contact'), at('landing'), registry)?.id).toBe(
      'contact>*',
    );
  });

  it('returns null for the same place (no flight — plain navigation)', () => {
    expect(resolveFlightPlan(at('services'), at('services'))).toBeNull();
    expect(
      resolveFlightPlan(at('serviceDetail', 'erp'), at('serviceDetail', 'erp')),
    ).toBeNull();
  });

  it('flies an orbit transfer between two different service planets', () => {
    expect(
      resolveFlightPlan(at('serviceDetail', 'erp'), at('serviceDetail', 'web'))
        ?.id,
    ).toBe('serviceDetail>serviceDetail');
  });
});

describe('makeRecoveryPlan (back/forward — the DOM already swapped)', () => {
  it('skips departure, gives a token cruise, keeps the arrival character', () => {
    const base = FLIGHT_PLANS['services>landing'];
    if (!base) throw new Error('missing base plan');
    const recovery = makeRecoveryPlan(base);
    expect(recovery.kind).toBe('recovery');
    expect(recovery.departure.duration).toBe(0);
    expect(recovery.cruise.minDuration).toBe(FLIGHT.RECOVERY_CRUISE);
    expect(recovery.arrival.decel).toBe(base.arrival.decel);
    expect(recovery.id).toContain(base.id);
  });
});
