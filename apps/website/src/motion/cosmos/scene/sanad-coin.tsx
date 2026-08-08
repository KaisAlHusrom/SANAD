'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Vector3,
  type Group,
  type Sprite,
  type SpriteMaterial,
} from 'three';
import { pageAccents } from '@sanad/config';
import { useCosmosScrollStore } from '../../scroll';
import { cameraY, coinTransform, smoothstep, worldColorAt } from '../math';
import { hexToTriplet, WORLD_GLOWS } from '../worlds';
import { makeGlowTexture } from '../builders';
import { COIN } from '../constants';

/**
 * The central "Sanad coin" (the persistent WEB10 element) — a glowing jewel that **leads the flight
 * like a comet**: a vertical streak tail (elongating with scroll velocity), a soft halo sprite
 * (tinted to the current world), two accent tori, and a wireframe+solid octahedron gem. It owns its
 * `useFrame`, reading the scroll store + rAF clock and driving every part from the pure
 * `coinTransform` math (spin, gem counter-rotation, scale out of the hero, halo pulse with warp,
 * orbital sway, lead-below-camera). RTL mirrors the sway via `dir` (WEB6); reduced-motion stills the
 * sway + tail. Transform-only, 60fps.
 */
export function SanadCoin({ dir }: { dir: 1 | -1 }) {
  const store = useCosmosScrollStore();
  const groupRef = useRef<Group>(null);
  const gemRef = useRef<Group>(null);
  const haloMatRef = useRef<SpriteMaterial>(null);
  const tailRef = useRef<Sprite>(null);
  const tailMatRef = useRef<SpriteMaterial>(null);

  const glow = useMemo(() => makeGlowTexture(), []);
  const impactVec = useMemo(() => new Vector3(), []);
  const [accent, secondary] = useMemo(() => {
    const a = hexToTriplet(pageAccents.landing.accent);
    const s = hexToTriplet(pageAccents.landing.secondary);
    return [new Color(a[0], a[1], a[2]), new Color(s[0], s[1], s[2])];
  }, []);

  useFrame((state) => {
    const group = groupRef.current;
    if (!store || !group) return;
    const s = store.getState();
    const t = state.clock.elapsedTime;
    const cy = cameraY(s.progress);
    const ct = coinTransform(
      t,
      s.progress,
      s.warp,
      dir,
      s.reducedMotion ? 0 : 1,
    );

    // leads the descent (full sway + lead-below-camera), holding a little ahead in Z
    group.position.set(
      ct.swayX,
      cy + ct.leadY,
      COIN.leadZ + (ct.swayZ - 70) * 0.3,
    );
    group.rotation.set(0, ct.rotY, 0);
    // as the impact finale opens, the coin BECOMES the comet: it flies from its flight position into
    // the published impact point (accelerating with aE = approach²), then vanishes at the strike so
    // the blast plays in its place
    if (s.finale > 0.0008 && s.finale < 0.5) {
      const approach = smoothstep(0, 0.5, s.finale);
      impactVec.set(s.impactX, s.impactY, s.impactZ);
      group.position.lerp(impactVec, approach * approach);
    }
    const fade = 1 - smoothstep(0.44, 0.5, s.finale);
    group.visible = fade > 0.01;
    group.scale.setScalar(ct.scale * fade);
    if (gemRef.current) gemRef.current.rotation.set(ct.gemRotX, ct.gemRotY, 0);
    const [r, g, b] = worldColorAt(s.progress, WORLD_GLOWS);
    if (haloMatRef.current) haloMatRef.current.color.setRGB(r, g, b);
    // comet tail — a vertical streak anchored at its base so it trails *up* behind the descending
    // coin; it lengthens + brightens with scroll velocity (warp) and stills under reduced-motion
    if (tailRef.current && tailMatRef.current) {
      tailRef.current.center.set(0.5, 0);
      const warp = s.reducedMotion ? 0 : s.warp;
      tailRef.current.scale.set(11, 42 + warp * 150, 1);
      tailMatRef.current.color.setRGB(r, g, b);
      tailMatRef.current.opacity = (0.1 + warp * 0.6) * fade;
    }
    // halo scale tracks the warp/breath pulse from the coin math (the halo is the sprite that
    // isn't the tail — the tail owns its own scale above)
    const haloSprite = group.children.find(
      (c): c is Sprite => c.type === 'Sprite' && c !== tailRef.current,
    );
    if (haloSprite) haloSprite.scale.setScalar((ct.haloScale / 118) * 78);
  });

  return (
    <group ref={groupRef}>
      <sprite ref={tailRef} position={[0, 0, -6]}>
        <spriteMaterial
          ref={tailMatRef}
          map={glow}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          opacity={0}
        />
      </sprite>

      <sprite>
        <spriteMaterial
          ref={haloMatRef}
          map={glow}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          opacity={0.32}
        />
      </sprite>

      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry
          args={[COIN.outerRing.radius, COIN.outerRing.tube, 16, 96]}
        />
        <meshStandardMaterial
          color={accent}
          emissive={accent}
          emissiveIntensity={0.9}
          roughness={0.35}
          metalness={0.2}
        />
      </mesh>
      <mesh rotation={[Math.PI / 2.4, 0, 0]}>
        <torusGeometry
          args={[COIN.midRing.radius, COIN.midRing.tube, 16, 96]}
        />
        <meshStandardMaterial
          color={secondary}
          emissive={secondary}
          emissiveIntensity={0.8}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      <group ref={gemRef}>
        <mesh>
          <octahedronGeometry args={[COIN.gemRadius, 0]} />
          <meshBasicMaterial
            color={accent}
            transparent
            opacity={0.22}
            blending={AdditiveBlending}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <octahedronGeometry args={[COIN.gemRadius, 0]} />
          <meshBasicMaterial
            color={COIN.gemWire}
            wireframe
            transparent
            opacity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}
