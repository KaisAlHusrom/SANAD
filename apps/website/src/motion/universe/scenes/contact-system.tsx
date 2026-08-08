'use client';

import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, type Group, type Sprite } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import { makeGlowTexture, makeRayTexture } from '../../cosmos/builders';
import { beaconPulse } from '../math/beacon-pulse';
import { SYSTEM_ACCENTS } from '../math/system-colors';
import { BEACON } from './system-scenes.constants';
import { DeepSpaceIdle } from './deep-space-idle';

/**
 * The contact star system — "The Beacon" (P8.D): near-empty calm space with a small emerald
 * relay emitting slow expanding signal rings (the page's ONE signature element, WEB9) and a
 * single far companion light. The quietest system — the form is the hero; the scene only
 * says "your signal reaches us". Calm mode freezes the pulse (WEB4); emerald from the token
 * source (U6).
 */
export function ContactSystem() {
  const store = useCosmosScrollStore();
  const raysRef = useRef<Sprite>(null);
  const ringsRef = useRef<Group>(null);
  const glow = useMemo(() => makeGlowTexture(), []);
  const rays = useMemo(() => makeRayTexture(), []);
  const accent = SYSTEM_ACCENTS.contact;

  useFrame((state) => {
    if (!store) return;
    const still = store.getState().reducedMotion;
    const t = still ? 0.6 : state.clock.elapsedTime;
    if (raysRef.current)
      raysRef.current.material.rotation = still ? 0 : t * BEACON.RAYS.spin;
    const rings = ringsRef.current;
    if (rings) {
      rings.children.forEach((ring, i) => {
        const pulse = beaconPulse(t, i);
        ring.scale.setScalar(BEACON.RING_BASE * pulse.scale);
        const material = (ring as Sprite).material as { opacity?: number };
        if ('opacity' in material) material.opacity = pulse.opacity;
      });
    }
  });

  return (
    <>
      <DeepSpaceIdle system="contact" />

      <group position={[BEACON.CORE.x, BEACON.CORE.y, BEACON.CORE.z]}>
        <sprite ref={raysRef} scale={[BEACON.RAYS.scale, BEACON.RAYS.scale, 1]}>
          <spriteMaterial
            map={rays}
            transparent
            opacity={0.35}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>
        <sprite scale={[BEACON.CORE.scale, BEACON.CORE.scale, 1]}>
          <spriteMaterial
            map={glow}
            transparent
            opacity={0.9}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[accent[0], accent[1], accent[2]]}
          />
        </sprite>
        {/* the signal — expanding rings, staggered so the transmission reads continuous */}
        <group ref={ringsRef} rotation={[BEACON.RING_TILT, 0, 0]}>
          {Array.from({ length: BEACON.RING_COUNT }, (_, i) => (
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
      </group>

      {/* one far companion light — someone is listening on the other side */}
      <sprite
        position={[BEACON.FAR_DOT.x, BEACON.FAR_DOT.y, BEACON.FAR_DOT.z]}
        scale={[BEACON.FAR_DOT.scale, BEACON.FAR_DOT.scale, 1]}
      >
        <spriteMaterial
          map={glow}
          transparent
          opacity={BEACON.FAR_DOT.opacity}
          blending={AdditiveBlending}
          depthWrite={false}
          color={[accent[0], accent[1], accent[2]]}
        />
      </sprite>
    </>
  );
}
