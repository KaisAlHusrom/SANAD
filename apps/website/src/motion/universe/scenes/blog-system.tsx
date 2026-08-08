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
import { LOGBOOK } from './system-scenes.constants';
import { DeepSpaceIdle } from './deep-space-idle';

const PALETTE = universeSystems.blog.palette.map(hexToTriplet) as [
  ColorTriplet,
  ColorTriplet,
  ColorTriplet,
];

// module-level texture cache (P8.E-3): the rocky surface is static — a re-visit must not rebuild it.
let surfaceCache: Texture | null = null;
function getSurface(): Texture {
  surfaceCache ??= makePlanetTexture('rocky', PALETTE);
  return surfaceCache;
}

/**
 * The blog star system — "The Logbook" (P8.E-3): one steady, unringed amber rocky planet (a warm,
 * calm reading world) circled by a slow drift of small sparks — the log's entries — the page's ONE
 * signature element (WEB9). Like the About "Hearth" it is deliberately still: reading is not a
 * journey, so the entries only drift (no scroll-tied spin). Calm mode stills it entirely (WEB4);
 * amber palette from the token source (U6, single-sourced off `landingWorlds.blog`, U3).
 */
export function BlogSystem() {
  const store = useCosmosScrollStore();
  const coreRef = useRef<Mesh>(null);
  const sparksRef = useRef<Group>(null);

  const surface = useMemo(() => getSurface(), []);
  const halo = useMemo(() => makeGlowTexture(), []);
  const spark = useMemo(() => makeGlowTexture(), []);
  const accent = SYSTEM_ACCENTS.blog;
  const sparkSlots = useMemo(
    () => constellationLayout(LOGBOOK.SPARKS.count, LOGBOOK.SPARKS.orbit),
    [],
  );

  useFrame((state) => {
    if (!store) return;
    const still = store.getState().reducedMotion;
    const t = state.clock.elapsedTime;
    if (coreRef.current) coreRef.current.rotation.y = still ? 0 : t * 0.015;
    if (sparksRef.current)
      sparksRef.current.rotation.y = still ? 0 : t * LOGBOOK.SPARKS.drift;
  });

  return (
    <>
      <DeepSpaceIdle system="blog" />
      <directionalLight intensity={1.15} position={[-0.4, 0.5, 0.7]} />

      <group position={[LOGBOOK.CORE.x, LOGBOOK.CORE.y, LOGBOOK.CORE.z]}>
        {/* the logbook's steady amber glow */}
        <sprite
          scale={[
            LOGBOOK.CORE.radius * LOGBOOK.HALO.scale,
            LOGBOOK.CORE.radius * LOGBOOK.HALO.scale,
            1,
          ]}
        >
          <spriteMaterial
            map={halo}
            transparent
            opacity={LOGBOOK.HALO.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>

        <mesh ref={coreRef} rotation={[LOGBOOK.CORE.tilt, 0, 0]}>
          <sphereGeometry args={[LOGBOOK.CORE.radius, 64, 64]} />
          <meshStandardMaterial map={surface} roughness={0.95} metalness={0} />
        </mesh>

        {/* the log's entries — a slow-drifting ring of small sparks */}
        <group ref={sparksRef}>
          {sparkSlots.map((slot, i) => (
            <sprite
              key={i}
              position={[slot.x, slot.y, slot.z]}
              scale={[LOGBOOK.SPARKS.scale, LOGBOOK.SPARKS.scale, 1]}
            >
              <spriteMaterial
                map={spark}
                transparent
                opacity={LOGBOOK.SPARKS.opacity}
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
