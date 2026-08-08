'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, type Group, type LineBasicMaterial } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import { warpStreak, worldColorAt } from '../math';
import { makeWarpGeometry } from '../builders';
import { WORLD_GLOWS } from '../worlds';
import { WARP } from '../constants';

/**
 * Hyperspace warp streaks (WEB9) — vertical light lines around the camera that stretch and brighten
 * with scroll velocity (`warp`) and vanish when the page is still, so the effect is a signed jump-
 * to-lightspeed, never a permanent field. Built once; each frame the group follows the camera,
 * scales its length, and the material fades + tints to the current world glow. Additive, 60fps.
 */
export function WarpStreaks() {
  const store = useCosmosScrollStore();
  const camera = useThree((s) => s.camera);
  const groupRef = useRef<Group>(null);
  const matRef = useRef<LineBasicMaterial>(null);
  const positions = useMemo(
    () => makeWarpGeometry(WARP.maxCount, WARP.spread),
    [],
  );

  useFrame(() => {
    if (!store) return;
    const s = store.getState();
    const streak = warpStreak(s.warp);
    const group = groupRef.current;
    if (group) {
      group.visible = streak.opacity > 0.002;
      // follow the ACTUAL camera (was `cameraY(progress)`): identical on the scroll flight,
      // and it keeps the streak field around the camera in the comet corridor too (P8.D)
      group.position.y = camera.position.y;
      group.scale.y = Math.max(1, streak.length / 8);
    }
    if (matRef.current) {
      matRef.current.opacity = streak.opacity;
      const [r, g, b] = worldColorAt(s.progress, WORLD_GLOWS);
      matRef.current.color.setRGB(r, g, b);
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      <lineSegments frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          ref={matRef}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}
