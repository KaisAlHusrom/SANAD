'use client';

import { useContext } from 'react';
import { FlightDirectorContext } from '../director/flight-director-context';
import type { FlightDirector } from '../director/flight-director';

/** Read the flight director (null outside `UniverseProvider` — consumers no-op, U5). */
export function useFlightDirector(): FlightDirector | null {
  return useContext(FlightDirectorContext);
}
