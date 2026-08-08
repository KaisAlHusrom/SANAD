import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { createFlightDirector } from '../director/flight-director';
import { FlightDirectorContext } from '../director/flight-director-context';
import { SystemStage } from './system-stage';

describe('SystemStage + SystemReady (the route-ready signal, P8.D)', () => {
  it('re-syncs the director to the mounted page system (direct load)', () => {
    const director = createFlightDirector({
      initialSystem: 'landing',
      schedule: () => () => undefined,
    });
    render(
      <FlightDirectorContext.Provider value={director}>
        <SystemStage system="services">content</SystemStage>
      </FlightDirectorContext.Provider>,
    );
    expect(director.getState().currentSystem).toBe('services');
  });

  it('releases a flight arrival gate with the ACTUAL landed system + slug', () => {
    const director = createFlightDirector({
      initialSystem: 'landing',
      schedule: () => () => undefined,
    });
    director.depart({
      href: '/ar/services/erp',
      to: { system: 'serviceDetail', slug: 'erp' },
    });
    render(
      <FlightDirectorContext.Provider value={director}>
        <SystemStage system="serviceDetail" slug="erp" />
      </FlightDirectorContext.Provider>,
    );
    const s = director.getState();
    expect(s.routeReady).toBe(true);
    expect(s.to).toBe('serviceDetail');
    expect(s.toSlug).toBe('erp');
  });

  it('renders the marker attributes and no-ops without a provider', () => {
    const { container } = render(
      <SystemStage system="contact">form</SystemStage>,
    );
    const stage = container.querySelector('.system-stage');
    expect(stage?.getAttribute('data-system')).toBe('contact');
  });
});
