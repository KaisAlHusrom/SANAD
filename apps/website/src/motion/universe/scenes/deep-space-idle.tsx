'use client';

import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Color, PerspectiveCamera, SRGBColorSpace, type FogExp2 } from 'three';
import { universeSystems } from '@sanad/config';
import { useCosmosScrollStore } from '../../scroll';
import { CAMERA, FOG } from '../../cosmos/constants';
import { cameraParallax, lookAtTarget, warpFov } from '../../cosmos/math';
import { makeGlowTexture } from '../../cosmos/builders';
import { AdditiveBlending } from 'three';
import { SYSTEM_ACCENTS } from '../math/system-colors';
import { AMBIENT_GLOW, SYSTEM_SCROLL_TRAVEL } from './system-scenes.constants';
import type { SystemId } from '../types';

/**
 * The shared idle base every non-landing system composes (P8.D): the system's own fog tint
 * over the shared starfield (owned by `UniverseScene`), and the camera at rest — cursor
 * parallax plus a subtle scroll-linked descent, so scrolling any page still reads as drifting
 * through that system's space. Also the whole scene for `ambient` (CMS pages / 404 / error):
 * deliberately quiet, adrift in the landing's light with one far point of light as its only
 * signature (WEB9). During a flight the `FlightRig` (priority 0.9) overrides camera + fog
 * after these writes.
 */
export function DeepSpaceIdle({ system }: { system: SystemId }) {
  const store = useCosmosScrollStore();
  const gl = useThree((s) => s.gl);
  const camera = useThree((s) => s.camera);
  const fogRef = useRef<FogExp2>(null);
  const glow = useMemo(() => makeGlowTexture(), []);
  const ambientAccent = SYSTEM_ACCENTS.ambient;

  // authored raw like every cosmos colour (ColorManagement is off — WEB11 pipeline); the
  // sRGB tag mirrors scene-lighting's fog recipe so the two lighting paths stay identical
  const fogColor = useMemo(() => {
    const c = new Color();
    const hex = universeSystems[system].fog;
    const r = parseInt(hex.slice(1, 3), 16) / 255;
    const g = parseInt(hex.slice(3, 5), 16) / 255;
    const b = parseInt(hex.slice(5, 7), 16) / 255;
    c.setRGB(r, g, b, SRGBColorSpace);
    return c;
  }, [system]);

  useFrame(() => {
    if (!store) return;
    const s = store.getState();
    if (fogRef.current) fogRef.current.color.copy(fogColor);
    gl.setClearColor(fogColor, 1);
    const par = cameraParallax(s.cursorX, s.cursorY);
    // scrolling the page drifts gently deeper into the system's space (scroll-linked, WEB10)
    const descent = s.progress * SYSTEM_SCROLL_TRAVEL;
    camera.position.set(par.x, par.y - descent, CAMERA.z);
    const look = lookAtTarget(s.cursorX, -descent);
    camera.lookAt(look.x, look.y, look.z);
    if (camera instanceof PerspectiveCamera) {
      const fov = warpFov(0); // at rest — and this resets any FOV a departed system left behind
      if (Math.abs(camera.fov - fov) > 0.02) {
        camera.fov = fov;
        camera.updateProjectionMatrix();
      }
    }
  });

  return (
    <>
      <fogExp2 ref={fogRef} attach="fog" args={[0x05080d, FOG.density]} />
      <ambientLight color={0x2b3a52} intensity={0.95} />
      {system === 'ambient' && (
        <sprite
          position={[AMBIENT_GLOW.x, AMBIENT_GLOW.y, AMBIENT_GLOW.z]}
          scale={[AMBIENT_GLOW.scale, AMBIENT_GLOW.scale, 1]}
        >
          <spriteMaterial
            map={glow}
            transparent
            opacity={AMBIENT_GLOW.opacity}
            blending={AdditiveBlending}
            depthWrite={false}
            color={[ambientAccent[0], ambientAccent[1], ambientAccent[2]]}
          />
        </sprite>
      )}
    </>
  );
}
