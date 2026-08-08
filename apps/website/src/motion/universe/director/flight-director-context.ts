'use client';

import { createContext } from 'react';
import type { FlightDirector } from './flight-director';

/**
 * The flight director's React context (P8.D). Provided once by `UniverseProvider` in the
 * locale layout and re-provided inside the R3F canvas (the `<Canvas>` mounts its own
 * reconciler root, same as the cosmos scroll store). Null outside the provider so leaf
 * consumers (`SystemReady`) can no-op in isolation/tests.
 */
export const FlightDirectorContext = createContext<FlightDirector | null>(null);
