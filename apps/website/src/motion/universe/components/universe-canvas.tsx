'use client';

import { ColorManagement } from 'three';
import { Canvas } from '@react-three/fiber';
import { CosmosScrollContext, type CosmosScrollStore } from '../../scroll';
import { CAMERA } from '../../cosmos/constants';
import type { FlightDirector } from '../director/flight-director';
import { FlightDirectorContext } from '../director/flight-director-context';
import { UniverseScene } from '../scenes/universe-scene';

// Disable Three's ColorManagement at MODULE LOAD (before any `new Color()` in the scene runs) — the
// R3F `legacy` prop flips this same global flag but only during Canvas init, by which point some
// colours may already be created + sRGB-converted (r3f #2523 timing gotcha). Setting it here first
// guarantees EVERY colour is authored raw/linear like the reference Three r128.
ColorManagement.enabled = false;

/**
 * THE one R3F `<Canvas>` of the whole site (P8.D) — lifted verbatim from the landing's
 * `cosmos-canvas.tsx` and hosted in the layout so it persists across routes. Every renderer
 * flag below is the locked WEB11 r128 pipeline — NEVER change them independently:
 * **`legacy` + `flat` + `linear`** reproduce three r128's raw pipeline (no ColorManagement,
 * no tone-mapping, linear output — without `linear` the r128 bloom's `MeshBasicMaterial`
 * blit gamma-lifts the whole frame into the recurring grey-space bug), and
 * **`alpha:false`** keeps the canvas opaque so the additive `UnrealBloomPass` doesn't wash
 * the background into haze. The `<Canvas>` mounts its own reconciler root, so both the
 * scroll store AND the flight director are taken as props and re-provided inside. DPR caps
 * at 2; antialias off (bloom does the smoothing) to keep the flight at 60fps.
 */
export default function UniverseCanvas({
  store,
  director,
  dir,
  onContextLost,
}: {
  store: CosmosScrollStore;
  director: FlightDirector;
  dir: 1 | -1;
  /** GPU context lost → the mount falls back to the static layer (veil-only flights). */
  onContextLost?: () => void;
}) {
  return (
    <Canvas
      className="cosmos-canvas"
      legacy
      flat
      linear
      dpr={[1, 2]}
      gl={{
        antialias: false,
        powerPreference: 'high-performance',
        alpha: false,
      }}
      camera={{
        position: [0, 0, CAMERA.z],
        fov: CAMERA.fov,
        near: CAMERA.near,
        far: CAMERA.far,
      }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault();
          onContextLost?.();
        });
      }}
    >
      <CosmosScrollContext.Provider value={store}>
        <FlightDirectorContext.Provider value={director}>
          <UniverseScene dir={dir} />
        </FlightDirectorContext.Provider>
      </CosmosScrollContext.Provider>
    </Canvas>
  );
}
