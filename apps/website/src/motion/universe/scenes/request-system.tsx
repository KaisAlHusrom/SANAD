'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  type Group,
  type Mesh,
  type Sprite,
  type Texture,
} from 'three';
import { universeSystems } from '@sanad/config';
import { useCosmosScrollStore } from '../../scroll';
import { makeGlowTexture, makePlanetTexture } from '../../cosmos/builders';
import { hexToTriplet } from '../../cosmos/worlds';
import type { ColorTriplet } from '../../cosmos/types';
import { beaconPulse } from '../math/beacon-pulse';
import { SYSTEM_ACCENTS } from '../math/system-colors';
import { LAUNCHPAD } from './system-scenes.constants';
import { DeepSpaceIdle } from './deep-space-idle';

const PALETTE = universeSystems.request.palette.map(hexToTriplet) as [
  ColorTriplet,
  ColorTriplet,
  ColorTriplet,
];

// module-level texture cache (P8.E-5): the rocky launch-world is static — a re-visit must not rebuild it.
let surfaceCache: Texture | null = null;
function getSurface(): Texture {
  surfaceCache ??= makePlanetTexture('rocky', PALETTE);
  return surfaceCache;
}

/**
 * The request star system — "The Launchpad" (P8.E-5): the flagship "Start a project" surface. Not
 * a place you idle — a place you lift off from: a rocky launch-world low in the frame, a hot
 * ignition core with staged liftoff rings, and an ember column rising past the camera (the page's
 * ONE signature, WEB9). Calm mode parks the ascent + rings (WEB4); the warm rose/coral comes from
 * the token source (U6, single-sourced off `universeSystems.request`, U3).
 */
export function RequestSystem() {
  const store = useCosmosScrollStore();
  const worldRef = useRef<Mesh>(null);
  const trailRef = useRef<Group>(null);
  const ringsRef = useRef<Group>(null);

  const surface = useMemo(() => getSurface(), []);
  const halo = useMemo(() => makeGlowTexture(), []);
  const ember = useMemo(() => makeGlowTexture(), []);
  const accent = SYSTEM_ACCENTS.request;

  useFrame((state) => {
    if (!store) return;
    const still = store.getState().reducedMotion;
    const t = still ? 0.5 : state.clock.elapsedTime;
    if (worldRef.current) worldRef.current.rotation.y = still ? 0 : t * 0.02;

    // the ember column — each ember loops from the launch point up past the camera, fading in/out
    const trail = trailRef.current;
    if (trail) {
      trail.children.forEach((node, i) => {
        const phase = i / LAUNCHPAD.TRAIL.count;
        const cycle = still ? phase : (t * LAUNCHPAD.TRAIL.speed + phase) % 1;
        node.position.y = LAUNCHPAD.TRAIL.baseY + cycle * LAUNCHPAD.TRAIL.riseY;
        const mat = (node as Sprite).material as { opacity?: number };
        if ('opacity' in mat)
          mat.opacity = LAUNCHPAD.TRAIL.opacity * Math.sin(cycle * Math.PI);
      });
    }

    // staged liftoff rings — an expanding shockwave at the launch point (reuses the beacon pulse)
    const rings = ringsRef.current;
    if (rings) {
      rings.children.forEach((ring, i) => {
        const pulse = beaconPulse(t, i);
        ring.scale.setScalar(LAUNCHPAD.RING.base * pulse.scale);
        const mat = (ring as Mesh).material as { opacity?: number };
        if ('opacity' in mat) mat.opacity = pulse.opacity;
      });
    }
  });

  return (
    <>
      <DeepSpaceIdle system="request" />
      <directionalLight intensity={1.15} position={[-0.3, 0.6, 0.7]} />

      {/* the launch-world — the rocky ground you lift off from, held low in the frame */}
      <group
        position={[LAUNCHPAD.WORLD.x, LAUNCHPAD.WORLD.y, LAUNCHPAD.WORLD.z]}
      >
        <sprite
          scale={[
            LAUNCHPAD.WORLD.radius * LAUNCHPAD.HALO.scale,
            LAUNCHPAD.WORLD.radius * LAUNCHPAD.HALO.scale,
            1,
          ]}
        >
          <spriteMaterial
            map={halo}
            transparent
            opacity={LAUNCHPAD.HALO.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>
        <mesh ref={worldRef} rotation={[LAUNCHPAD.WORLD.tilt, 0, 0]}>
          <sphereGeometry args={[LAUNCHPAD.WORLD.radius, 64, 64]} />
          <meshStandardMaterial map={surface} roughness={0.95} metalness={0} />
        </mesh>
      </group>

      {/* the hot ignition core at the launch point */}
      <sprite
        position={[LAUNCHPAD.CORE.x, LAUNCHPAD.CORE.y, LAUNCHPAD.CORE.z]}
        scale={[LAUNCHPAD.CORE.scale, LAUNCHPAD.CORE.scale, 1]}
      >
        <spriteMaterial
          map={ember}
          transparent
          opacity={0.9}
          blending={AdditiveBlending}
          depthWrite={false}
          color={[accent[0], accent[1], accent[2]]}
        />
      </sprite>

      {/* staged liftoff rings — the countdown shockwave at the launch point */}
      <group
        ref={ringsRef}
        position={[0, LAUNCHPAD.RING.y, LAUNCHPAD.CORE.z]}
        rotation={[LAUNCHPAD.RING.tilt, 0, 0]}
      >
        {Array.from({ length: LAUNCHPAD.RING.count }, (_, i) => (
          <mesh key={i}>
            <ringGeometry args={[0.94, 1, 64]} />
            <meshBasicMaterial
              transparent
              opacity={0}
              blending={AdditiveBlending}
              depthWrite={false}
              color={[accent[0], accent[1], accent[2]]}
            />
          </mesh>
        ))}
      </group>

      {/* the ember column — embers rising past the camera (the launch trail) */}
      <group ref={trailRef}>
        {Array.from({ length: LAUNCHPAD.TRAIL.count }, (_, i) => {
          const x =
            ((i - (LAUNCHPAD.TRAIL.count - 1) / 2) / LAUNCHPAD.TRAIL.count) *
            LAUNCHPAD.TRAIL.spread;
          return (
            <sprite
              key={i}
              position={[x, LAUNCHPAD.TRAIL.baseY, LAUNCHPAD.CORE.z]}
              scale={[
                LAUNCHPAD.TRAIL.scale,
                LAUNCHPAD.TRAIL.scale * LAUNCHPAD.TRAIL.stretch,
                1,
              ]}
            >
              <spriteMaterial
                map={ember}
                transparent
                opacity={0}
                blending={AdditiveBlending}
                depthWrite={false}
                color={[PALETTE[0][0], PALETTE[0][1], PALETTE[0][2]]}
              />
            </sprite>
          );
        })}
      </group>

      {/* the far destination star — where the launch is headed */}
      <sprite
        position={[
          LAUNCHPAD.FAR_STAR.x,
          LAUNCHPAD.FAR_STAR.y,
          LAUNCHPAD.FAR_STAR.z,
        ]}
        scale={[LAUNCHPAD.FAR_STAR.scale, LAUNCHPAD.FAR_STAR.scale, 1]}
      >
        <spriteMaterial
          map={ember}
          transparent
          opacity={LAUNCHPAD.FAR_STAR.opacity}
          blending={AdditiveBlending}
          depthWrite={false}
          color={[accent[0], accent[1], accent[2]]}
        />
      </sprite>
    </>
  );
}
