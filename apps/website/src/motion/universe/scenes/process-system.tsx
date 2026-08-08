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
import { SYSTEM_ACCENTS } from '../math/system-colors';
import { WAYPOINTS } from './system-scenes.constants';
import { DeepSpaceIdle } from './deep-space-idle';

const PALETTE = universeSystems.process.palette.map(hexToTriplet) as [
  ColorTriplet,
  ColorTriplet,
  ColorTriplet,
];

// module-level texture cache (P8.E-2): the planet + moon surfaces are static.
let surfaceCache: { planet: Texture; moon: Texture } | null = null;
function getSurfaces(): { planet: Texture; moon: Texture } {
  surfaceCache ??= {
    planet: makePlanetTexture('gas', PALETTE),
    moon: makePlanetTexture('rocky', PALETTE),
  };
  return surfaceCache;
}

/**
 * The process star system — "Waypoints" (P8.E-2): the landing process world's indigo planet
 * (unringed) with 4 small moons orbiting continuously — one per phase (discovery/design/build/
 * launch), the page's ONE signature element (WEB9), echoing the landing `ProcessMoons` idea in
 * 3D. Each moon holds a fixed angular offset (`i / count`) so they read as a sequence, not a
 * cluster. `DeepSpaceIdle` owns fog + camera; calm mode stills the orbit (WEB4). Indigo palette
 * from the token source (U6, single-sourced off `landingWorlds.process`).
 */
export function ProcessSystem() {
  const store = useCosmosScrollStore();
  const planetRef = useRef<Mesh>(null);
  const moonsRef = useRef<Group>(null);

  const { planet: surface, moon: moonSurface } = useMemo(
    () => getSurfaces(),
    [],
  );
  const halo = useMemo(() => makeGlowTexture(), []);
  const accent = SYSTEM_ACCENTS.process;
  const moonOffsets = useMemo(
    () =>
      Array.from(
        { length: WAYPOINTS.MOON.count },
        (_, i) => (i / WAYPOINTS.MOON.count) * Math.PI * 2,
      ),
    [],
  );

  useFrame((state) => {
    if (!store) return;
    const still = store.getState().reducedMotion;
    const t = still ? 0 : state.clock.elapsedTime;
    if (planetRef.current) planetRef.current.rotation.y = t * 0.02;
    const moons = moonsRef.current;
    if (moons) {
      moons.children.forEach((moon, i) => {
        const offset = moonOffsets[i];
        if (offset === undefined) return;
        const angle = offset + t * WAYPOINTS.MOON.spin;
        moon.position.set(
          Math.cos(angle) * WAYPOINTS.MOON.orbit,
          Math.sin(angle) * WAYPOINTS.MOON.orbit * WAYPOINTS.MOON.squash,
          Math.sin(angle) * 30,
        );
      });
    }
  });

  return (
    <>
      <DeepSpaceIdle system="process" />
      <directionalLight intensity={1.2} position={[-0.45, 0.48, 0.7]} />

      <group
        position={[WAYPOINTS.PLANET.x, WAYPOINTS.PLANET.y, WAYPOINTS.PLANET.z]}
      >
        <sprite
          scale={[
            WAYPOINTS.PLANET.radius * WAYPOINTS.HALO.scale,
            WAYPOINTS.PLANET.radius * WAYPOINTS.HALO.scale,
            1,
          ]}
        >
          <spriteMaterial
            map={halo}
            transparent
            opacity={WAYPOINTS.HALO.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>

        <mesh ref={planetRef} rotation={[WAYPOINTS.PLANET.tilt, 0, 0]}>
          <sphereGeometry args={[WAYPOINTS.PLANET.radius, 64, 64]} />
          <meshStandardMaterial map={surface} roughness={0.9} metalness={0} />
        </mesh>

        {/* the 4 phases — moons in sequence around the planet */}
        <group ref={moonsRef}>
          {Array.from({ length: WAYPOINTS.MOON.count }, (_, i) => (
            <mesh key={i}>
              <sphereGeometry args={[WAYPOINTS.MOON.radius, 32, 32]} />
              <meshStandardMaterial
                map={moonSurface}
                roughness={0.95}
                metalness={0}
              />
            </mesh>
          ))}
        </group>
      </group>
    </>
  );
}
