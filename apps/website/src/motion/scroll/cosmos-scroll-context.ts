'use client';

import { createContext, useContext } from 'react';
import type { CosmosScrollStore } from './cosmos-scroll-store';

/**
 * Carries the one `CosmosScrollStore` instance (created in `MotionProvider`) to both the R3F canvas
 * and the DOM overlays (chapters, moons, works) so they share a single scroll source of truth.
 * `null` outside the provider — consumers that require it use `useCosmosScrollStore`.
 */
export const CosmosScrollContext = createContext<CosmosScrollStore | null>(
  null,
);

/** The store, or `null` when rendered outside `MotionProvider` (SSR/tests tolerate the null). */
export function useCosmosScrollStore(): CosmosScrollStore | null {
  return useContext(CosmosScrollContext);
}
