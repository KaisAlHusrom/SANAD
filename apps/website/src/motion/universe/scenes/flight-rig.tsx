'use client';

import { useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, PerspectiveCamera, SRGBColorSpace } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import { BLOOM } from '../../cosmos/constants';
import { warpFov } from '../../cosmos/math';
import type { BloomHandle } from '../../cosmos/finale';
import { arrivalPose, cruisePose, departurePose } from '../math/comet-path';
import { mixTriplet, paletteMix, voidDip } from '../math/palette-crossfade';
import { SYSTEM_FOGS } from '../math/system-colors';
import { systemRestPose, type FlightPose } from '../math/system-rest-pose';
import { travelWarp } from '../math/travel-warp';
import { useFlightDirector } from '../hooks/use-flight-director';
import type { FlightPhase } from '../types';

/** Snapshot the live camera as a FlightPose (the look-at is reconstructed just below). */
function captureCameraPose(
  camera: PerspectiveCamera,
  prev: FlightPose | null,
): FlightPose {
  return {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
    // the scene's cameras always look just below themselves; carrying the previous pose's
    // look (or the descent default) avoids decomposing the camera matrix per capture
    lookX: prev ? prev.lookX : 0,
    lookY: prev ? prev.lookY : camera.position.y - 30,
    lookZ: prev ? prev.lookZ : 0,
    roll: 0,
  };
}

/**
 * The flight's WebGL choreography (P8.D) — camera, lighting and warp during a travel.
 * Runs at `useFrame` priority 0.9: AFTER every system scene's own camera/fog write (so the
 * rig always wins while flying) and BEFORE the bloom composite at 1. Reads the director
 * imperatively; each phase interpolates from the pose the camera was ACTUALLY at when the
 * phase began (continuous by construction, see `math/comet-path.ts`).
 *
 * Under reduced motion the rig only crossfades the fog tint (essential "you are moving"
 * feedback) — camera, FOV, warp and bloom stay untouched (WEB4).
 */
export function FlightRig({
  dir,
  bloomRef,
}: {
  dir: 1 | -1;
  bloomRef: RefObject<BloomHandle | null>;
}) {
  const director = useFlightDirector();
  const store = useCosmosScrollStore();
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const lastPhase = useRef<FlightPhase>('idle');
  const entryPose = useRef<FlightPose | null>(null);
  const fogColor = useRef(new Color());

  useFrame(() => {
    if (!director || !store) return;
    const st = director.getState();

    if (st.phase === 'idle' || !st.plan) {
      if (lastPhase.current !== 'idle') {
        // release everything back to the idle owners (system scenes + scroll warp)
        store.setTravelWarp(0);
        if (bloomRef.current) bloomRef.current.strength = BLOOM.strength;
        lastPhase.current = 'idle';
        entryPose.current = null;
      }
      return;
    }

    if (st.phase !== lastPhase.current) {
      entryPose.current = captureCameraPose(
        camera as PerspectiveCamera,
        entryPose.current,
      );
      lastPhase.current = st.phase;
    }
    const entry = entryPose.current;
    if (!entry) return;

    // ---- the shared warp field (streaks, coin tail, FOV all feed off the store) ----
    const travel = travelWarp(st.phase, st.t, st.plan);
    store.setTravelWarp(travel);

    // ---- space tint: origin → destination, dipping toward the void mid-cruise ----
    const mix = paletteMix(st.phase, st.t, st.plan);
    const dip = voidDip(st.phase, st.t, st.plan);
    const from = SYSTEM_FOGS[st.from ?? st.currentSystem];
    const to = SYSTEM_FOGS[st.to ?? st.currentSystem];
    const [r, g, b] = mixTriplet(from, to, mix);
    fogColor.current.setRGB(
      r * (1 - dip),
      g * (1 - dip),
      b * (1 - dip),
      SRGBColorSpace,
    );
    if (scene.fog && 'color' in scene.fog)
      scene.fog.color.copy(fogColor.current);
    gl.setClearColor(fogColor.current, 1);

    if (st.reducedMotion) return; // tint only — no camera/bloom motion in calm mode (WEB4)

    // ---- the comet path ----
    const pose =
      st.phase === 'departure'
        ? departurePose(st.t, entry, st.plan, dir)
        : st.phase === 'cruise'
          ? cruisePose(st.phaseElapsed, entry, st.plan, dir)
          : arrivalPose(
              st.t,
              entry,
              systemRestPose(st.to ?? st.currentSystem),
              st.plan,
              dir,
            );
    camera.position.set(pose.x, pose.y, pose.z);
    camera.lookAt(pose.lookX, pose.lookY, pose.lookZ);
    camera.rotation.z += pose.roll;

    // ---- FOV: the shared warp field plus the departure's extra kick ----
    if (camera instanceof PerspectiveCamera) {
      let fov = warpFov(store.getState().warp);
      if (st.phase === 'departure') {
        fov += st.plan.departure.fovKick * Math.sin(Math.PI * st.t);
      }
      if (Math.abs(camera.fov - fov) > 0.02) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }

    // ---- bloom surge on ignition ----
    if (bloomRef.current) {
      const surge =
        st.phase === 'departure'
          ? 1 + (st.plan.departure.bloomSurge - 1) * Math.sin(Math.PI * st.t)
          : 1;
      bloomRef.current.strength = BLOOM.strength * surge;
    }
  }, 0.9);

  return null;
}
