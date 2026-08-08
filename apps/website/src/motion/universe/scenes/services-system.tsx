'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  type Group,
  type LineBasicMaterial,
  type Sprite,
} from 'three';
import { universeSystems } from '@sanad/config';
import type { Texture } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import {
  makeGlowTexture,
  makePlanetTexture,
  makeRayTexture,
} from '../../cosmos/builders';
import { hexToTriplet } from '../../cosmos/worlds';
import type { ColorTriplet } from '../../cosmos/types';
import { constellationLayout } from '../math/constellation-layout';
import { SYSTEM_ACCENTS } from '../math/system-colors';
import { CONSTELLATION } from './system-scenes.constants';
import { DeepSpaceIdle } from './deep-space-idle';

const PALETTE = universeSystems.services.palette.map(hexToTriplet) as [
  ColorTriplet,
  ColorTriplet,
  ColorTriplet,
];

// module-level texture cache: navigating away and back must not rebuild the 1024×512
// procedural surfaces (an arrival-frame hitch) — the worlds are static per system (P8.D inc 8)
let worldTextureCache: Texture[] | null = null;
function getWorldTextures(): Texture[] {
  worldTextureCache ??= CONSTELLATION.WORLD_TYPES.map((type) =>
    makePlanetTexture(type, PALETTE),
  );
  return worldTextureCache;
}

/**
 * The services star system — "The Constellation" (P8.D): a bright sky-blue anchor star with
 * the service worlds arranged on a slow elliptical ring, joined by faint light-lines that
 * breathe (the page's ONE signature element, WEB9). Scroll gently rotates the constellation
 * and descends the camera (`DeepSpaceIdle` owns fog + camera); RTL reverses the rotation
 * sign via `dir` (WEB6). Colors are the services palette from the token source (U6).
 */
export function ServicesSystem({ dir }: { dir: 1 | -1 }) {
  const store = useCosmosScrollStore();
  const ringRef = useRef<Group>(null);
  const rayARef = useRef<Sprite>(null);
  const rayBRef = useRef<Sprite>(null);
  const linesMatRef = useRef<LineBasicMaterial>(null);

  const glow = useMemo(() => makeGlowTexture(), []);
  const rays = useMemo(() => makeRayTexture(), []);
  const palette = PALETTE;
  const slots = useMemo(
    () =>
      constellationLayout(CONSTELLATION.RING.worlds, CONSTELLATION.RING.radius),
    [],
  );
  const worldTextures = useMemo(() => getWorldTextures(), []);
  const linesGeometry = useMemo(() => {
    const positions = new Float32Array(slots.length * 3);
    slots.forEach((slot, i) => {
      positions[i * 3] = slot.x;
      positions[i * 3 + 1] = slot.y;
      positions[i * 3 + 2] = slot.z;
    });
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new BufferAttribute(positions, 3));
    return geometry;
  }, [slots]);
  const accent = SYSTEM_ACCENTS.services;

  useFrame((state) => {
    if (!store) return;
    const s = store.getState();
    const t = state.clock.elapsedTime;
    const still = s.reducedMotion;
    if (ringRef.current) {
      ringRef.current.rotation.y =
        (still ? 0 : t * CONSTELLATION.SPIN.time * dir) +
        s.progress * CONSTELLATION.SPIN.scroll * dir;
    }
    if (rayARef.current)
      rayARef.current.material.rotation = still
        ? 0
        : t * CONSTELLATION.STAR.raySpin;
    if (rayBRef.current)
      rayBRef.current.material.rotation = still
        ? 0
        : -t * CONSTELLATION.STAR.raySpin;
    if (linesMatRef.current) {
      linesMatRef.current.opacity =
        CONSTELLATION.LINES.base +
        (still
          ? 0
          : Math.abs(Math.sin(t * CONSTELLATION.LINES.speed)) *
            CONSTELLATION.LINES.pulse);
    }
  });

  return (
    <>
      <DeepSpaceIdle system="services" />
      <directionalLight intensity={1.2} position={[-0.5, 0.4, 0.75]} />

      {/* the anchor star — glow core + counter-rotating ray fans (bloom does the rest) */}
      <group
        position={[
          CONSTELLATION.STAR.x,
          CONSTELLATION.STAR.y,
          CONSTELLATION.STAR.z,
        ]}
      >
        <sprite
          ref={rayARef}
          scale={[CONSTELLATION.STAR.rayScale, CONSTELLATION.STAR.rayScale, 1]}
        >
          <spriteMaterial
            map={rays}
            transparent
            opacity={0.5}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>
        <sprite
          ref={rayBRef}
          scale={[
            CONSTELLATION.STAR.rayScale * 0.8,
            CONSTELLATION.STAR.rayScale * 0.8,
            1,
          ]}
        >
          <spriteMaterial
            map={rays}
            transparent
            opacity={0.4}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>
        <sprite
          scale={[
            CONSTELLATION.STAR.coreScale,
            CONSTELLATION.STAR.coreScale,
            1,
          ]}
        >
          <spriteMaterial
            map={glow}
            transparent
            opacity={0.95}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[palette[0][0], palette[0][1], palette[0][2]]}
          />
        </sprite>
      </group>

      {/* the constellation ring: the service worlds + their light-lines */}
      <group
        ref={ringRef}
        position={[
          CONSTELLATION.RING.x,
          CONSTELLATION.RING.y,
          CONSTELLATION.RING.z,
        ]}
      >
        {slots.map((slot, i) => (
          <mesh key={i} position={[slot.x, slot.y, slot.z]}>
            <sphereGeometry
              args={[CONSTELLATION.WORLD_RADII[i] ?? 18, 48, 48]}
            />
            <meshStandardMaterial
              map={worldTextures[i]}
              roughness={0.92}
              metalness={0}
            />
          </mesh>
        ))}
        <lineLoop geometry={linesGeometry} frustumCulled={false}>
          <lineBasicMaterial
            ref={linesMatRef}
            transparent
            opacity={CONSTELLATION.LINES.base}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </lineLoop>
      </group>
    </>
  );
}
