'use client';

import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { SRGBColorSpace, type DirectionalLight, type FogExp2 } from 'three';
import { useCosmosScrollStore } from '../../scroll';
import { worldColorAt } from '../math';
import { WORLD_FOGS, WORLD_GLOWS } from '../worlds';
import { FOG } from '../constants';

/**
 * The scene's light + fog (WEB10), tinted to whichever world you're over. The **exponential fog**
 * (and the renderer clear colour) lerp to the section's deep-space `fog` tint, so distant planets
 * dissolve into that world's dark; a **directional sun** grades each planet's terminator, its colour
 * lerped from the world glow toward white. Ambient fills the shadow side. Ported from the reference
 * `initThree`/`updateScene`.
 */
export function SceneLighting() {
  const store = useCosmosScrollStore();
  const gl = useThree((s) => s.gl);
  const fogRef = useRef<FogExp2>(null);
  const sunRef = useRef<DirectionalLight>(null);

  useFrame(() => {
    if (!store) return;
    const s = store.getState();
    const [fr, fg, fb] = worldColorAt(s.progress, WORLD_FOGS);
    // the fog triplets are sRGB (deep-space near-black tints); tag them sRGB so the flat pipeline
    // doesn't gamma-lift the full-screen clear into a washed mid-tone (U21e — matches the reference's
    // near-black deep space). The additive stars/coin/glows keep their pop against it.
    if (fogRef.current) fogRef.current.color.setRGB(fr, fg, fb, SRGBColorSpace);
    gl.setClearColor(fogRef.current ? fogRef.current.color : 0x05080d, 1);
    if (sunRef.current) {
      const [r, g, b] = worldColorAt(s.progress, WORLD_GLOWS);
      // grade the glow toward white (0.58) so the terminator stays a clean sunlit edge
      sunRef.current.color.setRGB(
        r + (1 - r) * 0.58,
        g + (1 - g) * 0.58,
        b + (1 - b) * 0.58,
      );
    }
  });

  return (
    <>
      <fogExp2 ref={fogRef} attach="fog" args={[0x05080d, FOG.density]} />
      <ambientLight color={0x2b3a52} intensity={0.95} />
      <directionalLight
        ref={sunRef}
        intensity={1.3}
        position={[-0.55, 0.42, 0.72]}
      />
    </>
  );
}
