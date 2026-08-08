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
import { detailOrbit, detailSeed } from '../math/detail-orbit';
import { SYSTEM_ACCENTS } from '../math/system-colors';
import { CLOSE_ORBIT } from './system-scenes.constants';
import { DeepSpaceIdle } from './deep-space-idle';

const PALETTE = universeSystems.serviceDetail.palette.map(hexToTriplet) as [
  ColorTriplet,
  ColorTriplet,
  ColorTriplet,
];

// module-level texture cache (P8.D inc 8): the surfaces are shared by every service planet
// (the slug seeds spin/ring/moons, not the paint) — orbit transfers must not rebuild them
let surfaceCache: { planet: Texture; moon: Texture; ring: Texture } | null =
  null;
function getSurfaces(): { planet: Texture; moon: Texture; ring: Texture } {
  surfaceCache ??= {
    planet: makePlanetTexture('gas', PALETTE),
    moon: makePlanetTexture('rocky', PALETTE),
    ring: makeRingTexture(PALETTE[1]),
  };
  return surfaceCache;
}

/**
 * The serviceDetail star system — "Close Orbit" (P8.D): ONE large indigo ringed planet held
 * close on the inline-end side (mirrored under RTL via `dir`, WEB6), its ring tilt, moon
 * count and phases seeded from the service SLUG — every service is its own world. Scroll
 * advances the orbit (`detailOrbit`); `DeepSpaceIdle` owns fog + camera; calm mode stills
 * the spin (WEB4). Indigo palette from the token source (U6).
 */
export function ServiceDetailSystem({
  slug,
  dir,
}: {
  slug: string | null;
  dir: 1 | -1;
}) {
  const store = useCosmosScrollStore();
  const planetRef = useRef<Mesh>(null);
  const moonsRef = useRef<Group>(null);
  const seed = useMemo(() => detailSeed(slug ?? 'service'), [slug]);

  const {
    planet: surface,
    moon: moonSurface,
    ring: ringTexture,
  } = useMemo(() => getSurfaces(), []);
  const halo = useMemo(() => makeGlowTexture(), []);
  const accent = SYSTEM_ACCENTS.serviceDetail;
  const orbitAtRest = useMemo(() => detailOrbit(0, 0, seed), [seed]);

  useFrame((state) => {
    if (!store) return;
    const s = store.getState();
    const orbit = detailOrbit(
      s.reducedMotion ? 0 : state.clock.elapsedTime,
      s.progress,
      seed,
    );
    if (planetRef.current) planetRef.current.rotation.y = orbit.planetSpin;
    const moons = moonsRef.current;
    if (moons) {
      moons.children.forEach((moon, i) => {
        const angle = orbit.moonAngles[i];
        if (angle === undefined) return;
        moon.position.set(
          Math.cos(angle) * CLOSE_ORBIT.MOON.orbit,
          Math.sin(angle) * CLOSE_ORBIT.MOON.orbit * CLOSE_ORBIT.MOON.squash,
          Math.sin(angle) * 40,
        );
      });
    }
  });

  const planetX = CLOSE_ORBIT.PLANET.x * dir;

  return (
    <>
      <DeepSpaceIdle system="serviceDetail" />
      <directionalLight intensity={1.25} position={[-0.55 * dir, 0.42, 0.72]} />

      <group position={[planetX, CLOSE_ORBIT.PLANET.y, CLOSE_ORBIT.PLANET.z]}>
        {/* the world itself — slug-seeded spin; its halo feeds the bloom */}
        <sprite
          scale={[
            CLOSE_ORBIT.PLANET.radius * CLOSE_ORBIT.HALO.scale,
            CLOSE_ORBIT.PLANET.radius * CLOSE_ORBIT.HALO.scale,
            1,
          ]}
        >
          <spriteMaterial
            map={halo}
            transparent
            opacity={CLOSE_ORBIT.HALO.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>
        <mesh ref={planetRef} rotation={[CLOSE_ORBIT.PLANET.tilt, 0, 0]}>
          <sphereGeometry args={[CLOSE_ORBIT.PLANET.radius, 64, 64]} />
          <meshStandardMaterial map={surface} roughness={0.9} metalness={0} />
        </mesh>
        {/* the seeded ring — a real annulus (the strip texture wraps the ringGeometry, same
            recipe as the landing's ringed worlds), laid near-flat and seed-tilted to camera */}
        <mesh
          rotation={[
            -Math.PI / 2 + orbitAtRest.ringTilt * CLOSE_ORBIT.RING.tiltScale,
            0,
            0.1 * dir,
          ]}
        >
          <ringGeometry
            args={[
              CLOSE_ORBIT.PLANET.radius * CLOSE_ORBIT.RING.inner,
              CLOSE_ORBIT.PLANET.radius * CLOSE_ORBIT.RING.outer,
              CLOSE_ORBIT.RING.segments,
              1,
            ]}
          />
          <meshBasicMaterial
            map={ringTexture}
            transparent
            opacity={CLOSE_ORBIT.RING.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            side={DoubleSide}
          />
        </mesh>
        {/* the service's modules — its moons */}
        <group ref={moonsRef}>
          {Array.from({ length: orbitAtRest.moonCount }, (_, i) => (
            <mesh key={i}>
              <sphereGeometry
                args={[CLOSE_ORBIT.MOON.radius - i * 3, 32, 32]}
              />
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
