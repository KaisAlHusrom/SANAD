import { describe, expect, it } from 'vitest';
import { createIdleFlightState } from './flight-phases';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import type { FlightState } from '../types';
import { activeSystem } from './active-system';

const plan = FLIGHT_PLANS['landing>services'];
if (!plan) throw new Error('missing plan');

function flying(phase: FlightState['phase']): FlightState {
  return {
    ...createIdleFlightState('landing'),
    phase,
    from: 'landing',
    to: 'services',
    toSlug: null,
    plan,
  };
}

describe('activeSystem (which scene is mounted per phase)', () => {
  it('mounts the resting system at idle', () => {
    expect(activeSystem(createIdleFlightState('contact')).system).toBe(
      'contact',
    );
  });

  it('keeps the ORIGIN mounted through departure (its worlds recede behind the ignition)', () => {
    expect(activeSystem(flying('departure')).system).toBe('landing');
  });

  it('mounts the DESTINATION from the cruise on (preloads under the tunnel)', () => {
    expect(activeSystem(flying('cruise')).system).toBe('services');
    expect(activeSystem(flying('arrival')).system).toBe('services');
  });
});
