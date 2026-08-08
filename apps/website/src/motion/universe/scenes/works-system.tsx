'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, DoubleSide, type Group, type Mesh } from 'three';
import { universeSystems } from '@sanad/config';
import type { Texture } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import {
  makeGlowTexture,
  makePlanetTexture,
  makeRingTexture,
} from '../../cosmos/builders';
import { hexToTriplet } from '../../cosmos/worlds';
import type { ColorTriplet } from '../../cosmos/types';
import { constellationLayout } from '../math/constellation-layout';
import { SYSTEM_ACCENTS } from '../math/system-colors';
import { GALAXY } from './system-scenes.constants';
import { DeepSpaceIdle } from './deep-space-idle';

const PALETTE = universeSystems.works.palette.map(hexToTriplet) as [
  ColorTriplet,
  ColorTriplet,
  ColorTriplet,
];

// module-level texture cache (P8.E): the works planet + ring surfaces are static per system —
// an index↔detail hop must not rebuild them (an arrival-frame hitch).
let surfaceCache: { planet: Texture; ring: Texture } | null = null;
function getSurfaces(): { planet: Texture; ring: Texture } {
  surfaceCache ??= {
    planet: makePlanetTexture('gas', PALETTE),
    ring: makeRingTexture(PALETTE[1]),
  };
  return surfaceCache;
}

/**
 * The works star system — "The Galaxy" (P8.E): the landing's largest world (the violet ringed
 * planet the project cards orbit) held low-centre as the portfolio backdrop, with the case-study
 * "sparks" circling it on a wide ring (the page's ONE signature element, WEB9). Scroll + time
 * rotate the sparks and spin the planet; RTL reverses the sign via `dir` (WEB6); calm mode stills
 * it (WEB4). `DeepSpaceIdle` owns fog + camera. Violet palette from the token source (U6). The
 * index and a case-study detail share this system, so browsing between them is an intra-system hop.
 */
export function WorksSystem({ dir }: { dir: 1 | -1 }) {
  const store = useCosmosScrollStore();
  const planetRef = useRef<Mesh>(null);
  const sparksRef = useRef<Group>(null);

  const { planet: surface, ring: ringTexture } = useMemo(
    () => getSurfaces(),
    [],
  );
  const halo = useMemo(() => makeGlowTexture(), []);
  const spark = useMemo(() => makeGlowTexture(), []);
  const accent = SYSTEM_ACCENTS.works;
  const sparkSlots = useMemo(
    () => constellationLayout(GALAXY.SPARKS.count, GALAXY.SPARKS.orbit),
    [],
  );

  useFrame((state) => {
    if (!store) return;
    const s = store.getState();
    const t = state.clock.elapsedTime;
    const still = s.reducedMotion;
    if (planetRef.current) planetRef.current.rotation.y = still ? 0 : t * 0.03;
    if (sparksRef.current) {
      sparksRef.current.rotation.y =
        (still ? 0 : t * GALAXY.SPARKS.spin * dir) +
        s.progress * GALAXY.SPARKS.scroll * dir;
    }
  });

  return (
    <>
      <DeepSpaceIdle system="works" />
      <directionalLight intensity={1.2} position={[-0.5, 0.45, 0.72]} />

      <group position={[GALAXY.PLANET.x, GALAXY.PLANET.y, GALAXY.PLANET.z]}>
        {/* the planet's soft halo feeds the bloom */}
        <sprite
          scale={[
            GALAXY.PLANET.radius * GALAXY.HALO.scale,
            GALAXY.PLANET.radius * GALAXY.HALO.scale,
            1,
          ]}
        >
          <spriteMaterial
            map={halo}
            transparent
            opacity={GALAXY.HALO.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>

        <mesh ref={planetRef} rotation={[GALAXY.PLANET.tilt, 0, 0]}>
          <sphereGeometry args={[GALAXY.PLANET.radius, 64, 64]} />
          <meshStandardMaterial map={surface} roughness={0.9} metalness={0} />
        </mesh>

        {/* the ring — a real annulus (the strip texture wraps the ringGeometry) */}
        <mesh rotation={[-Math.PI / 2 + GALAXY.RING.tilt, 0, 0.08 * dir]}>
          <ringGeometry
            args={[
              GALAXY.PLANET.radius * GALAXY.RING.inner,
              GALAXY.PLANET.radius * GALAXY.RING.outer,
              GALAXY.RING.segments,
              1,
            ]}
          />
          <meshBasicMaterial
            map={ringTexture}
            transparent
            opacity={GALAXY.RING.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>

        {/* the case-study sparks circling the galaxy */}
        <group ref={sparksRef}>
          {sparkSlots.map((slot, i) => (
            <sprite
              key={i}
              position={[slot.x, slot.y, slot.z]}
              scale={[GALAXY.SPARKS.scale, GALAXY.SPARKS.scale, 1]}
            >
              <spriteMaterial
                map={spark}
                transparent
                opacity={GALAXY.SPARKS.opacity}
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
