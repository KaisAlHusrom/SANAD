'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { AdditiveBlending, type Sprite, type SpriteMaterial } from 'three';
import { makeGlowTexture } from '../../cosmos/builders';
import { smoothstep } from '../../cosmos/math';
import { COMET } from '../constants';
import { mixTriplet, paletteMix } from '../math/palette-crossfade';
import { SYSTEM_ACCENTS } from '../math/system-colors';
import { useFlightDirector } from '../hooks/use-flight-director';

/**
 * The traveler itself (P8.D): an additive comet — glow core + warp-stretched tail — that
 * ignites on departure, leads the camera down the corridor and burns out into the arrival.
 * Tinted from the origin accent to the destination accent as the flight crosses systems.
 * Camera-relative each frame (reads the director + camera imperatively); hidden at idle and
 * in calm mode (`reducePlan` zeroes ignition + warp, WEB4).
 */
export function FlightComet({ dir }: { dir: 1 | -1 }) {
  const director = useFlightDirector();
  const camera = useThree((s) => s.camera);
  const coreRef = useRef<Sprite>(null);
  const tailRef = useRef<Sprite>(null);
  const coreMatRef = useRef<SpriteMaterial>(null);
  const tailMatRef = useRef<SpriteMaterial>(null);
  const glow = useMemo(() => makeGlowTexture(), []);

  useFrame(() => {
    const core = coreRef.current;
    const tail = tailRef.current;
    if (!core || !tail) return;
    const st = director?.getState();
    // presence: how much comet this plan carries (0 for reduced-motion plans → hidden)
    const presence = st?.plan
      ? Math.max(st.plan.departure.ignition, st.plan.cruise.warp)
      : 0;
    if (!st || st.phase === 'idle' || !st.plan || presence <= 0) {
      core.visible = false;
      tail.visible = false;
      return;
    }

    const envelope =
      st.phase === 'departure'
        ? smoothstep(0.05, 0.5, st.t)
        : st.phase === 'cruise'
          ? 1
          : 1 - smoothstep(0.45, 0.95, st.t);
    const opacity = COMET.GLOW * presence * envelope;
    core.visible = opacity > 0.01;
    tail.visible = core.visible;
    if (!core.visible) return;

    const travel = st.plan.cruise.warp * (st.phase === 'cruise' ? 1 : envelope);
    const x = camera.position.x * 0.9 + dir * 10;
    const y = camera.position.y - COMET.LEAD_Y;
    core.position.set(x, y, COMET.Z);
    const tailLength = COMET.TAIL_BASE + travel * COMET.TAIL_WARP;
    // the tail trails BEHIND the dive (+Y) — the comet reads as leading the descent
    tail.position.set(x, y + tailLength * 0.42, COMET.Z);
    core.scale.setScalar(COMET.CORE_SCALE * (1 + travel * 0.4));
    tail.scale.set(COMET.TAIL_WIDTH, tailLength, 1);

    const mix = paletteMix(st.phase, st.t, st.plan);
    const [r, g, b] = mixTriplet(
      SYSTEM_ACCENTS[st.from ?? st.currentSystem],
      SYSTEM_ACCENTS[st.to ?? st.currentSystem],
      mix,
    );
    if (coreMatRef.current) {
      coreMatRef.current.opacity = opacity;
      coreMatRef.current.color.setRGB(r, g, b);
    }
    if (tailMatRef.current) {
      tailMatRef.current.opacity = opacity * 0.7;
      tailMatRef.current.color.setRGB(r, g, b);
    }
  });

  return (
    <>
      <sprite ref={coreRef} visible={false} frustumCulled={false}>
        <spriteMaterial
          ref={coreMatRef}
          map={glow}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
      <sprite ref={tailRef} visible={false} frustumCulled={false}>
        <spriteMaterial
          ref={tailMatRef}
          map={glow}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </sprite>
    </>
  );
}
