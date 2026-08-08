'use client';

import { useRef, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import type { Group } from 'three';
import { useFlightDirector } from '../hooks/use-flight-director';

/**
 * Hides the active system's worlds during the CRUISE (pure starfield + warp tunnel between
 * systems) while keeping them mounted — the destination scene builds its textures under the
 * tunnel (preload) and pops in for the arrival deceleration. Imperative visibility per frame,
 * no React re-render at the phase boundary.
 */
export function SystemVisibilityGroup({ children }: { children: ReactNode }) {
  const director = useFlightDirector();
  const ref = useRef<Group>(null);

  useFrame(() => {
    if (ref.current) {
      ref.current.visible = director?.getState().phase !== 'cruise';
    }
  });

  return <group ref={ref}>{children}</group>;
}
