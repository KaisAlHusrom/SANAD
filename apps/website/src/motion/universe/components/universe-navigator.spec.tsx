import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import {
  createFlightDirector,
  type FlightDirector,
} from '../director/flight-director';
import { FlightDirectorContext } from '../director/flight-director-context';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import { UniverseNavigator } from './universe-navigator';

const push = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  usePathname: () => '/ar',
}));

const plan = FLIGHT_PLANS['landing>services'];
if (!plan) throw new Error('missing plan');

function setup(): { director: FlightDirector; clock: { now: number } } {
  const director = createFlightDirector({
    initialSystem: 'landing',
    schedule: () => () => undefined,
  });
  render(
    <FlightDirectorContext.Provider value={director}>
      <UniverseNavigator />
    </FlightDirectorContext.Provider>,
  );
  const clock = { now: 0 };
  director.tick(0);
  return { director, clock };
}

function fly(
  director: FlightDirector,
  clock: { now: number },
  ms: number,
  step = 50,
) {
  const end = clock.now + ms;
  while (clock.now < end) {
    clock.now = Math.min(clock.now + step, end);
    director.tick(clock.now);
  }
}

describe('UniverseNavigator (router + scroll authority of a flight)', () => {
  beforeEach(() => {
    push.mockClear();
    window.scrollTo = vi.fn();
  });

  it('pushes the pending href exactly once at the departure→cruise boundary', () => {
    const { director, clock } = setup();
    director.depart({
      href: '/ar/services',
      to: { system: 'services', slug: null },
    });
    fly(director, clock, plan.departure.duration + 100);
    expect(push).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith('/ar/services');
  });

  it('hard-resets scroll to the very top at arrival entry — every page starts from its beginning', () => {
    const { director, clock } = setup();
    director.depart({
      href: '/ar/services',
      to: { system: 'services', slug: null },
    });
    fly(director, clock, plan.departure.duration + 100); // cruise
    expect(window.scrollTo).not.toHaveBeenCalled(); // never yanks the OLD page around
    director.markRouteReady({ system: 'services', slug: null });
    fly(director, clock, plan.cruise.minDuration + 200); // arrival begins (content still opacity 0)
    expect(director.getState().phase).toBe('arrival');
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it('leaves the browser scroll restoration alone on a recovery flight (back/forward)', () => {
    const { director, clock } = setup();
    director.depart({
      href: '/ar/services',
      to: { system: 'services', slug: null },
      recovery: true,
    });
    director.markRouteReady({ system: 'services', slug: null });
    fly(director, clock, 2000); // through the token cruise + arrival
    expect(window.scrollTo).not.toHaveBeenCalled();
  });
});
