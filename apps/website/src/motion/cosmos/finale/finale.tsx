'use client';

import { useMemo, useRef, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  AdditiveBlending,
  BackSide,
  BufferAttribute,
  Color,
  DirectionalLight,
  type BufferGeometry,
  type Mesh,
  type MeshBasicMaterial,
  type MeshStandardMaterial,
  type Points,
  type Sprite,
  type SpriteMaterial,
  Vector3,
} from 'three';
import { useCosmosScrollStore } from '../../scroll';
import {
  blastFlash,
  blastShake,
  debrisWave,
  earthApproachArc,
  earthHaloOpacity,
  finaleDim,
  finaleTimeline,
  smoothstep,
} from '../math';
import { makeGlowTexture } from '../builders';
import { BLOOM } from '../constants';
import { makeEarthTextures } from './make-earth-textures';

/** Earth radius (world units), from the reference finale. */
const EARTH_R = 240;
const EXP_N = 640;

/** A minimal bloom handle — the finale surges the `UnrealBloomPass` strength at the strike. */
export interface BloomHandle {
  strength: number;
}

/**
 * The impact finale (WEB10) — the travelling comet re-enters, strikes a procedural Earth, and the
 * blast (flash, fire, 640-point explosion, shock wave, bloom surge) plays as the whole scene
 * dissolves into the footer. Driven by the `#impact` section scroll via the pure `finaleTimeline`;
 * publishes its progress to the store (so the coin fades out) and surges the shared bloom. All
 * objects are camera-relative each frame. Transform/opacity only; hidden until the section is entered.
 */
export function Finale({
  bloomRef,
}: {
  bloomRef: RefObject<BloomHandle | null>;
}) {
  const store = useCosmosScrollStore();
  const camera = useThree((s) => s.camera);

  const soft = useMemo(() => makeGlowTexture(), []);
  const tex = useMemo(() => makeEarthTextures(), []);

  const earthGroup = useRef<Mesh>(null);
  const earthBody = useRef<Mesh>(null);
  const earthClouds = useRef<Mesh>(null);
  const bodyMat = useRef<MeshStandardMaterial>(null);
  const cloudMat = useRef<MeshBasicMaterial>(null);
  const atm1Mat = useRef<MeshBasicMaterial>(null);
  const atm2Mat = useRef<MeshBasicMaterial>(null);
  const haloMat = useRef<SpriteMaterial>(null);
  const flashRef = useRef<Sprite>(null);
  const fireRef = useRef<Sprite>(null);
  const shockRef = useRef<Mesh>(null);
  const shockMat = useRef<MeshBasicMaterial>(null);
  const debrisRef = useRef<Mesh>(null);
  const debrisMat = useRef<MeshBasicMaterial>(null);
  const pointsRef = useRef<Points>(null);
  const light = useRef<DirectionalLight>(null);

  // explosion seeds + buffers (built once)
  const { seeds, positions, colors } = useMemo(() => {
    const s: { ux: number; uy: number; uz: number; sp: number; siz: number }[] =
      [];
    for (let i = 0; i < EXP_N; i++) {
      const u = Math.random() * 2 - 1;
      const th = Math.random() * Math.PI * 2;
      const sq = Math.sqrt(1 - u * u);
      s.push({
        ux: sq * Math.cos(th),
        uy: u,
        uz: sq * Math.sin(th),
        sp: 0.35 + Math.random() * 1.7,
        siz: Math.random(),
      });
    }
    return {
      seeds: s,
      positions: new Float32Array(EXP_N * 3),
      colors: new Float32Array(EXP_N * 3),
    };
  }, []);

  // reusable frame scratch (no per-frame allocation)
  const v = useMemo(
    () => ({
      fwd: new Vector3(),
      right: new Vector3(),
      up: new Vector3(),
      cam: new Vector3(),
      ePos: new Vector3(),
      impact: new Vector3(),
      c0: new Color(),
      c1: new Color(),
    }),
    [],
  );

  const hideAll = (coinBack: boolean): void => {
    if (earthGroup.current) earthGroup.current.visible = false;
    if (flashRef.current) flashRef.current.visible = false;
    if (fireRef.current) fireRef.current.visible = false;
    if (shockRef.current) shockRef.current.visible = false;
    if (debrisRef.current) debrisRef.current.visible = false;
    if (pointsRef.current) pointsRef.current.visible = false;
    if (bloomRef.current) bloomRef.current.strength = BLOOM.strength;
    if (coinBack) store?.setFinale(0);
  };

  useFrame(() => {
    if (!store) return;
    const impact =
      typeof document !== 'undefined'
        ? document.getElementById('impact')
        : null;
    if (!impact) {
      hideAll(true);
      return;
    }
    const vh = window.innerHeight;
    const denom = Math.max(1, impact.offsetHeight - vh);
    const p = Math.min(
      1,
      Math.max(0, (window.scrollY - impact.offsetTop) / denom),
    );
    store.setFinale(p);

    if (p <= 0.0008 || p >= 0.985) {
      hideAll(false);
      return;
    }

    const t = finaleTimeline(p);
    const cam = v.cam.copy(camera.position);
    camera.getWorldDirection(v.fwd);
    v.right.crossVectors(v.fwd, new Vector3(0, 1, 0)).normalize();
    v.up.crossVectors(v.right, v.fwd).normalize();

    // ---- Earth ----
    const eg = earthGroup.current;
    if (eg) {
      eg.visible = true;
      // approaches from far away, rising into frame + swinging in laterally (arc) rather than
      // zooming dead-centre
      v.ePos
        .copy(cam)
        .addScaledVector(v.fwd, t.dist)
        .addScaledVector(v.up, (1 - t.a) * -150)
        .addScaledVector(v.right, earthApproachArc(t.a));
      eg.position.copy(v.ePos);
      eg.scale.setScalar(t.scale);
      if (earthBody.current) earthBody.current.rotation.y += 0.001;
      if (earthClouds.current) earthClouds.current.rotation.y += 0.0014;
      if (bodyMat.current) bodyMat.current.opacity = t.earthVis;
      if (cloudMat.current) cloudMat.current.opacity = 0.5 * t.earthVis;
      if (atm1Mat.current) atm1Mat.current.opacity = 0.26 * t.earthVis;
      if (atm2Mat.current) atm2Mat.current.opacity = 0.1 * t.earthVis;
      if (haloMat.current)
        haloMat.current.opacity = earthHaloOpacity(
          t.a,
          t.ex,
          t.blast,
          t.earthVis,
        );
    }
    if (light.current) {
      light.current.intensity = 1.5;
      light.current.position
        .copy(cam)
        .addScaledVector(v.right, -360)
        .addScaledVector(v.up, 240)
        .addScaledVector(v.fwd, 120);
    }

    const surfaceR = EARTH_R * t.scale;
    v.impact.copy(v.ePos).addScaledVector(v.fwd, -surfaceR);
    // publish the impact point so the Sanad coin flies into it as the comet (the coin you've
    // followed the whole journey becomes the meteor that strikes) — no detached sprite
    store.setFinaleImpact(v.impact.x, v.impact.y, v.impact.z);

    // ---- blast ----
    if (t.blast) {
      const flash = blastFlash(t.ex);
      if (bloomRef.current)
        bloomRef.current.strength =
          BLOOM.strength + flash * 1.25 + (1 - smoothstep(0, 0.7, t.ex)) * 0.4;

      if (flashRef.current) {
        const on = flash > 0.012;
        flashRef.current.visible = on;
        if (on) {
          flashRef.current.position.copy(cam).addScaledVector(v.fwd, 150);
          flashRef.current.scale.setScalar(
            170 + (780 - 170) * smoothstep(0, 0.4, t.ex),
          );
          (flashRef.current.material as SpriteMaterial).opacity = flash * 0.92;
        }
      }

      if (fireRef.current) {
        const fa = 1 - smoothstep(0.28, 1.25, t.ex);
        const on = fa > 0.012;
        fireRef.current.visible = on;
        if (on) {
          fireRef.current.position.copy(v.impact);
          fireRef.current.scale.setScalar(
            surfaceR * (0.5 + smoothstep(0, 0.6, t.ex) * 3.0),
          );
          const fm = fireRef.current.material as SpriteMaterial;
          fm.color
            .copy(v.c0.set('#bfefff'))
            .lerp(v.c1.set('#ff7a2a'), smoothstep(0.05, 0.65, t.ex));
          fm.opacity = fa * 0.62;
        }
      }

      // explosion points
      const pts = pointsRef.current;
      if (pts) {
        pts.visible = true;
        const spread = surfaceR * 7 * smoothstep(0, 1, t.ex);
        const fade = 1 - smoothstep(0.22, 1.3, t.ex);
        const grav = t.ex * t.ex * 60;
        if (t.ex < 0.4)
          v.c0.set('#ffffff').lerp(v.c1.set('#9af2ff'), t.ex / 0.4);
        else
          v.c0
            .set('#9af2ff')
            .lerp(
              v.c1.set('#ff7a2a'),
              Math.min(1, Math.max(0, (t.ex - 0.4) / 0.9)),
            );
        for (let i = 0; i < EXP_N; i++) {
          const sd = seeds[i];
          if (!sd) continue;
          let dx = sd.ux - v.fwd.x * 0.55;
          let dy = sd.uy - v.fwd.y * 0.55;
          let dz = sd.uz - v.fwd.z * 0.55;
          const l = Math.hypot(dx, dy, dz) || 1;
          dx /= l;
          dy /= l;
          dz /= l;
          const d = sd.sp * spread;
          positions[i * 3] = v.impact.x + dx * d;
          positions[i * 3 + 1] = v.impact.y + dy * d - grav;
          positions[i * 3 + 2] = v.impact.z + dz * d;
          const br = fade * (0.5 + 0.5 * sd.siz);
          colors[i * 3] = v.c0.r * br;
          colors[i * 3 + 1] = v.c0.g * br;
          colors[i * 3 + 2] = v.c0.b * br;
        }
        const geo = pts.geometry as BufferGeometry;
        (geo.attributes.position as BufferAttribute).needsUpdate = true;
        (geo.attributes.color as BufferAttribute).needsUpdate = true;
        (pts.material as MeshBasicMaterial).opacity = Math.min(1, fade * 1.2);
      }

      // shock wave (primary, cyan)
      const sw = smoothstep(0, 1.15, t.ex);
      if (shockRef.current && shockMat.current) {
        const on = sw > 0.001 && sw < 0.999;
        shockRef.current.visible = on;
        if (on) {
          shockRef.current.position.copy(v.impact);
          shockRef.current.scale.setScalar(surfaceR * (0.3 + sw * 5.5));
          shockMat.current.opacity = (1 - sw) * 0.55;
        }
      }

      // debris ring (secondary, warm) — a slower shock that lingers behind the cyan one
      const dw = debrisWave(t.ex);
      if (debrisRef.current && debrisMat.current) {
        const on = dw > 0.001 && dw < 0.999;
        debrisRef.current.visible = on;
        if (on) {
          debrisRef.current.position.copy(v.impact);
          debrisRef.current.scale.setScalar(surfaceR * (0.2 + dw * 3.4));
          debrisMat.current.opacity = (1 - dw) * 0.35;
        }
      }

      // camera shake — the strike jolts the view, decaying to still
      const shake = blastShake(t.ex);
      if (shake > 0.2) {
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
      }
    } else {
      if (flashRef.current) flashRef.current.visible = false;
      if (fireRef.current) fireRef.current.visible = false;
      if (pointsRef.current) pointsRef.current.visible = false;
      if (shockRef.current) shockRef.current.visible = false;
      if (debrisRef.current) debrisRef.current.visible = false;
      if (bloomRef.current) bloomRef.current.strength = BLOOM.strength;
    }

    // as the finale dissolves into the footer (p > 0.62), fade every additive blast layer with
    // finOut so nothing lingers over the revealed footer (reference)
    const dim = finaleDim(p, t.finOut);
    if (dim < 1) {
      if (haloMat.current) haloMat.current.opacity *= dim;
      if (flashRef.current)
        (flashRef.current.material as SpriteMaterial).opacity *= dim;
      if (fireRef.current)
        (fireRef.current.material as SpriteMaterial).opacity *= dim;
      if (pointsRef.current)
        (pointsRef.current.material as MeshBasicMaterial).opacity *= dim;
      if (shockMat.current) shockMat.current.opacity *= dim;
      if (debrisMat.current) debrisMat.current.opacity *= dim;
    }
  });

  return (
    <>
      <directionalLight ref={light} color={0xfff2dc} intensity={0} />
      <mesh ref={earthGroup} visible={false}>
        <mesh ref={earthBody}>
          <sphereGeometry args={[EARTH_R, 64, 44]} />
          <meshStandardMaterial
            ref={bodyMat}
            map={tex.day}
            emissiveMap={tex.night}
            roughness={1}
            metalness={0}
            emissive={new Color('#ffffff')}
            emissiveIntensity={0.9}
            transparent
            opacity={0}
            fog={false}
          />
        </mesh>
        <mesh ref={earthClouds}>
          <sphereGeometry args={[EARTH_R * 1.012, 64, 44]} />
          <meshBasicMaterial
            ref={cloudMat}
            map={tex.clouds}
            transparent
            opacity={0}
            depthWrite={false}
            fog={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[EARTH_R * 1.05, 64, 44]} />
          <meshBasicMaterial
            ref={atm1Mat}
            color={new Color('#63d2ff')}
            transparent
            opacity={0}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
        <mesh>
          <sphereGeometry args={[EARTH_R * 1.17, 64, 44]} />
          <meshBasicMaterial
            ref={atm2Mat}
            color={new Color('#22d3ee')}
            transparent
            opacity={0}
            side={BackSide}
            blending={AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </mesh>
        <sprite scale={EARTH_R * 4.6}>
          <spriteMaterial
            ref={haloMat}
            map={soft}
            color={new Color('#7ef0ff')}
            transparent
            opacity={0}
            blending={AdditiveBlending}
            depthWrite={false}
            fog={false}
          />
        </sprite>
      </mesh>

      <sprite ref={flashRef} visible={false}>
        <spriteMaterial
          map={soft}
          color={0xffffff}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </sprite>
      <sprite ref={fireRef} visible={false}>
        <spriteMaterial
          map={soft}
          color={new Color('#cfeeff')}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          depthWrite={false}
          fog={false}
        />
      </sprite>

      <points ref={pointsRef} visible={false} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
        </bufferGeometry>
        <pointsMaterial
          map={soft}
          size={15}
          vertexColors
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          sizeAttenuation
          opacity={1}
          fog={false}
        />
      </points>

      <mesh ref={shockRef} visible={false}>
        <sphereGeometry args={[1, 36, 26]} />
        <meshBasicMaterial
          ref={shockMat}
          color={new Color('#bdf6ff')}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          side={BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>

      <mesh ref={debrisRef} visible={false}>
        <sphereGeometry args={[1, 36, 26]} />
        <meshBasicMaterial
          ref={debrisMat}
          color={new Color('#ffb37a')}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          side={BackSide}
          depthWrite={false}
          fog={false}
        />
      </mesh>
    </>
  );
}
