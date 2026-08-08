'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type Group, type Mesh } from 'three';
import { universeSystems } from '@sanad/config';
import type { Texture } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import { makeGlowTexture, makePlanetTexture } from '../../cosmos/builders';
import { hexToTriplet } from '../../cosmos/worlds';
import type { ColorTriplet } from '../../cosmos/types';
import { constellationLayout } from '../math/constellation-layout';
import { SYSTEM_ACCENTS } from '../math/system-colors';
import { HEARTH } from './system-scenes.constants';
import { DeepSpaceIdle } from './deep-space-idle';

const PALETTE = universeSystems.about.palette.map(hexToTriplet) as [
  ColorTriplet,
  ColorTriplet,
  ColorTriplet,
];

// module-level texture cache (P8.E-2): the core surface is static — a re-visit must not rebuild it.
let surfaceCache: Texture | null = null;
function getSurface(): Texture {
  surfaceCache ??= makePlanetTexture('gas', PALETTE);
  return surfaceCache;
}

/**
 * The about star system — "The Hearth" (P8.E-2): one steady, unringed teal core (no ring, near-
 * still) with a thin ring of small sparks standing in for the team gathered around it — the
 * page's ONE signature element, WEB9. Deliberately the CALMEST system: About is about trust and
 * stability, not a journey, so the sparks only drift (no scroll-tied spin). Calm mode stills it
 * entirely (WEB4); teal palette from the token source (U6, single-sourced off `landingWorlds.trust`).
 */
export function AboutSystem() {
  const store = useCosmosScrollStore();
  const coreRef = useRef<Mesh>(null);
  const sparksRef = useRef<Group>(null);

  const surface = useMemo(() => getSurface(), []);
  const halo = useMemo(() => makeGlowTexture(), []);
  const spark = useMemo(() => makeGlowTexture(), []);
  const accent = SYSTEM_ACCENTS.about;
  const sparkSlots = useMemo(
    () => constellationLayout(HEARTH.SPARKS.count, HEARTH.SPARKS.orbit),
    [],
  );

  useFrame((state) => {
    if (!store) return;
    const still = store.getState().reducedMotion;
    const t = state.clock.elapsedTime;
    if (coreRef.current) coreRef.current.rotation.y = still ? 0 : t * 0.015;
    if (sparksRef.current)
      sparksRef.current.rotation.y = still ? 0 : t * HEARTH.SPARKS.drift;
  });

  return (
    <>
      <DeepSpaceIdle system="about" />
      <directionalLight intensity={1.15} position={[-0.4, 0.5, 0.7]} />

      <group position={[HEARTH.CORE.x, HEARTH.CORE.y, HEARTH.CORE.z]}>
        {/* the hearth's steady glow */}
        <sprite
          scale={[
            HEARTH.CORE.radius * HEARTH.HALO.scale,
            HEARTH.CORE.radius * HEARTH.HALO.scale,
            1,
          ]}
        >
          <spriteMaterial
            map={halo}
            transparent
            opacity={HEARTH.HALO.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>

        <mesh ref={coreRef} rotation={[HEARTH.CORE.tilt, 0, 0]}>
          <sphereGeometry args={[HEARTH.CORE.radius, 64, 64]} />
          <meshStandardMaterial map={surface} roughness={0.9} metalness={0} />
        </mesh>

        {/* the team gathered around the hearth — a still ring of small sparks */}
        <group ref={sparksRef}>
          {sparkSlots.map((slot, i) => (
            <sprite
              key={i}
              position={[slot.x, slot.y, slot.z]}
              scale={[HEARTH.SPARKS.scale, HEARTH.SPARKS.scale, 1]}
            >
              <spriteMaterial
                map={spark}
                transparent
                opacity={HEARTH.SPARKS.opacity}
                blending={AdditiveBlending}
                depthWrite={false}
                color={[PALETTE[0][0], PALETTE[0][1], PALETTE[0][2]]}
              />
            </sprite>
          ))}
        </group>
      </group>
    </>
  );
}
