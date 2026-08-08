import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { createFlightDirector } from '../director/flight-director';
import { FlightDirectorContext } from '../director/flight-director-context';
import { TravelLink } from './travel-link';

function setup(href: string) {
  const director = createFlightDirector({
    initialSystem: 'landing',
    schedule: () => () => undefined,
  });
  render(
    <FlightDirectorContext.Provider value={director}>
      <TravelLink href={href}>go</TravelLink>
    </FlightDirectorContext.Provider>,
  );
  return { director, anchor: screen.getByText('go') };
}

describe('TravelLink (P8.D — internal links start a flight)', () => {
  it('departs a flight and takes over the click for a cross-system href', () => {
    const { director, anchor } = setup('/ar/services');
    fireEvent.click(anchor);
    const s = director.getState();
    expect(s.phase).toBe('departure');
    expect(s.to).toBe('services');
    expect(s.pendingHref).toBe('/ar/services');
  });

  it('leaves modified clicks (new tab) to the browser', () => {
    const { director, anchor } = setup('/ar/services');
    fireEvent.click(anchor, { metaKey: true });
    expect(director.getState().phase).toBe('idle');
  });

  it('leaves a same-place click to plain Link navigation', () => {
    const { director, anchor } = setup('/ar');
    fireEvent.click(anchor);
    expect(director.getState().phase).toBe('idle');
  });

  it('renders and navigates safely without a universe provider', () => {
    render(<TravelLink href="/ar/contact">solo</TravelLink>);
    fireEvent.click(screen.getByText('solo'));
    expect(screen.getByText('solo').getAttribute('href')).toBe('/ar/contact');
  });
});
