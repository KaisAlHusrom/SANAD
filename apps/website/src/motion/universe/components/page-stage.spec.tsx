import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createFlightDirector } from '../director/flight-director';
import { FlightDirectorContext } from '../director/flight-director-context';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import { PageStage } from './page-stage';

const plan = FLIGHT_PLANS['landing>services'];
if (!plan) throw new Error('missing plan');

function setup() {
  const director = createFlightDirector({
    initialSystem: 'landing',
    schedule: () => () => undefined,
  });
  director.tick(0);
  const { container } = render(
    <FlightDirectorContext.Provider value={director}>
      <PageStage>content</PageStage>
    </FlightDirectorContext.Provider>,
  );
  const stage = container.querySelector('.page-stage') as HTMLElement;
  return { director, stage };
}

describe('PageStage (the DOM content choreography around a flight)', () => {
  it('SSRs/mounts as idle with no inline travel props (hydration-stable)', () => {
    const { stage } = setup();
    expect(stage.getAttribute('data-travel-phase')).toBe('idle');
    expect(stage.style.getPropertyValue('--travel-out')).toBe('');
  });

  it('carries the phase, plan styles and eased progress vars while flying', () => {
    const { director, stage } = setup();
    director.depart({
      href: '/ar/services',
      to: { system: 'services', slug: null },
    });
    director.tick(16);
    director.tick(16 + plan.departure.duration / 2);
    expect(stage.getAttribute('data-travel-phase')).toBe('departure');
    expect(stage.getAttribute('data-travel-exit')).toBe('streak-up');
    expect(stage.getAttribute('data-travel-enter')).toBe('rise');
    const out = Number(stage.style.getPropertyValue('--travel-out'));
    expect(out).toBeGreaterThan(0);
    expect(out).toBeLessThan(1);
  });

  it('hard-hides through the cruise and returns to a clean idle after arrival', () => {
    const { director, stage } = setup();
    director.depart({
      href: '/ar/services',
      to: { system: 'services', slug: null },
    });
    let now = 0;
    director.tick(now);
    while (director.getState().phase === 'departure')
      director.tick((now += 50));
    expect(stage.getAttribute('data-travel-phase')).toBe('cruise');
    director.markRouteReady({ system: 'services', slug: null });
    while (director.getState().phase !== 'idle' && now < 20_000) {
      director.tick((now += 50));
    }
    expect(stage.getAttribute('data-travel-phase')).toBe('idle');
    expect(stage.style.getPropertyValue('--travel-out')).toBe('');
    expect(stage.getAttribute('data-travel-exit')).toBeNull();
  });
});
