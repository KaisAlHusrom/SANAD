'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type Sprite, type SpriteMaterial } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import { cameraY, shootingStar } from '../math';
import { makeGlowTexture } from '../builders';
import { STAR_COLORS } from '../constants';

/**
 * The rare shooting star (8.B-4 Stage 2d) — a single stretched glow sprite that darts across the far
 * field once per `SHOOTING_STAR_PERIOD`, then the sky is quiet again (an event, not a field — WEB9).
 * Camera-relative (rides the flight like the warp), deterministic per cycle, dark under reduced
 * motion. One sprite, transform/opacity only.
 */
export function ShootingStarStreak() {
  const store = useCosmosScrollStore();
  const spriteRef = useRef<Sprite>(null);
  const matRef = useRef<SpriteMaterial>(null);
  const tex = useMemo(() => makeGlowTexture(), []);
  const tint = STAR_COLORS[0]?.[2] ?? '#ffffff';

  useFrame((state) => {
    const sprite = spriteRef.current;
    const mat = matRef.current;
    if (!store || !sprite || !mat) return;
    const s = store.getState();
    const st = shootingStar(state.clock.elapsedTime, s.reducedMotion);
    sprite.visible = st.active;
    if (!st.active) return;
    sprite.position.set(st.x, cameraY(s.progress) + st.y, -520);
    // the glow texture is radial; the sprite's long Y axis is swung onto the streak heading
    mat.rotation = st.angle + Math.PI / 2;
    mat.opacity = st.opacity * 0.5;
  });

  return (
    <sprite ref={spriteRef} visible={false} scale={[3.5, 90, 1]}>
      <spriteMaterial
        ref={matRef}
        map={tex}
        color={tint}
        transparent
        opacity={0}
        depthWrite={false}
        blending={AdditiveBlending}
        fog={false}
      />
    </sprite>
  );
}
