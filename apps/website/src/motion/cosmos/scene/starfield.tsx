'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type Group } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import { layerRotation } from '../math';
import { makeStarTexture, makeStarfield } from '../builders';
import { STAR_COLORS, STAR_LAYERS } from '../constants';

/**
 * Three parallax star layers (WEB9 — a bespoke depth field, not a generic dot cloud). Each layer is
 * **fixed in the world**, scattered radially across the whole flight, so the camera **streams
 * through** it as it flies — the endless-field read. Only the two nearer layers drift a whisper on Y
 * for parallax (no camera-follow, no swirl). Built once (no per-frame allocation). The canvas mounts
 * in full-motion + reduced mobile; calm holds the drift still (WEB4).
 */
export function Starfield() {
  const store = useCosmosScrollStore();
  const groupRef = useRef<Group>(null);
  // one crisp round sprite shared by every star (default points render as hard squares) — the
  // reference's sharp star gradient, not the soft coin/corona halo, so stars read as points of light
  const dot = useMemo(() => makeStarTexture(64), []);

  const layers = useMemo(
    () =>
      STAR_LAYERS.map((layer, i) => ({
        ...makeStarfield(layer.count, layer.spread, STAR_COLORS[i] ?? []),
        size: layer.size,
      })),
    [],
  );

  useFrame((state) => {
    const group = groupRef.current;
    if (!store || !group) return;
    const s = store.getState();
    // world-fixed: the group never follows the camera — the camera flies through the field
    const t = state.clock.elapsedTime;
    group.children.forEach((child, i) => {
      child.rotation.y = layerRotation(t, i, s.reducedMotion);
    });
  });

  return (
    <group ref={groupRef}>
      {layers.map((layer, i) => (
        <points key={i} frustumCulled={false}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              args={[layer.positions, 3]}
            />
            <bufferAttribute
              attach="attributes-color"
              args={[layer.colors, 3]}
            />
          </bufferGeometry>
          <pointsMaterial
            map={dot}
            alphaMap={dot}
            size={layer.size}
            vertexColors
            sizeAttenuation
            transparent
            opacity={0.75}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </points>
      ))}
    </group>
  );
}
