'use client';

import { useMemo, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import {
  cameraBank,
  cameraParallax,
  cameraY,
  lookAtTarget,
  warpFov,
} from '../math';
import { WORLD_DEFS } from '../worlds';
import { SceneLighting } from './scene-lighting';
import { WorldPlanets } from './world-planets';
import { SanadCoin } from './sanad-coin';
import { ShootingStarStreak } from './shooting-star-streak';
import { Finale, type BloomHandle } from '../finale';

/**
 * The landing star system (WEB10) — hosted by the persistent `UniverseScene` (P8.D), which
 * now owns the shared pieces (the scroll `tick()`, Starfield, WarpStreaks, bloom composer;
 * `bloomRef` arrives as a prop for the finale's surge). Everything else is the original
 * scroll-choreographed journey, untouched (WEB11): this `useFrame` drives the **camera**
 * down the ~2000-unit flight with cursor parallax; every other piece (lighting, planets,
 * coin) owns its own `useFrame` reading the same live store snapshot, fully imperative and
 * allocation-free. During a comet flight the `FlightRig` (priority 0.9) overrides the
 * camera after this write. Scroll-linked, never jacked; transform/GL only, 60fps.
 */
export function CosmosScene({
  dir,
  bloomRef,
}: {
  dir: 1 | -1;
  bloomRef: RefObject<BloomHandle | null>;
}) {
  const store = useCosmosScrollStore();
  const camera = useThree((s) => s.camera);

  const worldXs = useMemo(() => WORLD_DEFS.map((w) => w.position[0]), []);

  useFrame(() => {
    if (!store) return;
    const s = store.getState();
    const cy = cameraY(s.progress);
    const par = cameraParallax(s.cursorX, s.cursorY);
    // 8.B-4 flight feel: the camera leans toward the docking world's side and rolls through each
    // transition (level at every dock), and fast scroll widens the FOV — all stilled in calm mode
    const bank = s.reducedMotion
      ? { x: 0, roll: 0 }
      : cameraBank(s.progress, worldXs);
    camera.position.set(par.x + bank.x, cy + par.y, 420);
    const look = lookAtTarget(s.cursorX, cy);
    camera.lookAt(look.x, look.y, look.z);
    camera.rotation.z += bank.roll;
    if (camera instanceof PerspectiveCamera) {
      const fov = warpFov(s.reducedMotion ? 0 : s.warp);
      if (Math.abs(camera.fov - fov) > 0.02) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return (
    <>
      <SceneLighting />
      {/* NO ambient set dressing behind the star field — deep space stays reference-black. A
          "nebula backdrop" of faint additive sprites was tried in 8.B-4 and REMOVED (owner,
          2026-07-07): additive sprites ADD light even below the bloom threshold, and dozens of
          overlapping ones lifted the whole field into a mottled grey wash (the recurring WEB11
          grey-space complaint). */}
      <ShootingStarStreak />
      <WorldPlanets />
      <SanadCoin dir={dir} />
      <Finale bloomRef={bloomRef} />
    </>
  );
}
