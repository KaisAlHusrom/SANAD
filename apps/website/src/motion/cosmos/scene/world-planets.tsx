'use client';

import { useLayoutEffect, useMemo, useRef, type RefObject } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Euler,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
  type Group,
  type InstancedMesh,
  type IUniform,
  type Mesh,
  type MeshBasicMaterial,
  type SpriteMaterial,
  type Texture,
} from 'three';
import { useCosmosScrollStore, localProgress } from '../../scroll';
import {
  atmosphereIntensity,
  cameraY,
  gasFlowTime,
  moonOrbitPosition,
  planetPresence,
  prominenceState,
  ringRocks,
  smoothstep,
  starRayRotation,
  TOTAL_TRAVEL,
  type MoonDef,
} from '../math';
import {
  makeGlowTexture,
  makePlanetTexture,
  makeRayTexture,
  makeRingShadowTexture,
  makeRingTexture,
} from '../builders';
import { WORLD_DEFS } from '../worlds';
import { makeAtmosphereMaterial } from './atmosphere-material';
import { makeStarMaterial } from './star-material';
import { applyGasFlow } from './gas-flow';
import { useSectionMetrics, type SectionMetrics } from './use-section-metrics';
import type { WorldDef } from '../types';

/**
 * The nine per-section planets (WEB10), each rendered to its archetype — upgraded by 8.B-4 Stage 1
 * from the reference's flat materials to living surfaces: **stars** (hero/cta) carry a slow plasma
 * shader, two counter-rotating corona-ray sprites and a golden-angle prominence cycle; **gas**
 * worlds' band maps flow via a time-warped map patch; every non-star world swaps the flat BackSide
 * shell for a **fresnel limb atmosphere** (sun-biased rim). Ringed worlds keep the reference ring +
 * bright edge. Presence is still driven by each section's own scroll geometry (`useSectionMetrics`)
 * — arrival/dock/exit choreography and every reference glow number (halo `4.4`/`0.05+0.5`, corona
 * `5.4`) are unchanged (WEB11). Reduced motion freezes all surface life (WEB4). Transform +
 * uniforms only, 60fps.
 */

/** Sphere tessellation (reference desktop path). */
const SEGMENTS = 52;
const RINGS = 34;

/**
 * Which worlds carry moons (8.B-4 Stage 2b) and their orbits — planet-local runtime coordinates
 * (the U6 carve-out). Trust + testimonials each get a small companion; the works world gets a
 * shepherd riding just outside its ring.
 */
const MOON_DEFS: Record<string, readonly MoonDef[]> = {
  trust: [
    { orbitRadius: 152, speed: 0.16, phase: 0.8, inclination: 0.35, size: 11 },
  ],
  testimonials: [
    { orbitRadius: 134, speed: 0.21, phase: 2.4, inclination: 0.52, size: 9 },
  ],
  works: [
    { orbitRadius: 362, speed: 0.1, phase: 4.1, inclination: 1.2, size: 8 },
  ],
};

/** Instanced belt budget per ringed world (matrices composed once — zero per-frame cost). */
const ROCK_COUNT = 80;

function Planet({
  world,
  metricsRef,
  glowTex,
  rayTex,
}: {
  world: WorldDef;
  metricsRef: RefObject<SectionMetrics>;
  glowTex: Texture;
  rayTex: Texture;
}) {
  const store = useCosmosScrollStore();
  const groupRef = useRef<Group>(null);
  const spinRef = useRef<Mesh>(null);
  const coronaRef = useRef<SpriteMaterial>(null);
  const haloRef = useRef<SpriteMaterial>(null);
  const ringGroupRef = useRef<Group>(null);
  const rayARef = useRef<SpriteMaterial>(null);
  const rayBRef = useRef<SpriteMaterial>(null);
  const promGroupRef = useRef<Group>(null);
  const promMatRef = useRef<MeshBasicMaterial>(null);
  const moonsRef = useRef<Group>(null);
  const rocksRef = useRef<InstancedMesh>(null);

  const isStar = world.type === 'star';
  const glowColor = useMemo(() => new Color(...world.glow), [world.glow]);
  const flowTime = useMemo<IUniform<number>>(() => ({ value: 0 }), []);
  const surfaceMat = useMemo(() => {
    if (isStar) return null;
    const mat = new MeshStandardMaterial({
      map: makePlanetTexture(world.type, world.palette),
      emissive: new Color(...world.glow).multiplyScalar(0.05),
      roughness: 1,
      metalness: 0,
    });
    if (world.type === 'gas') applyGasFlow(mat, flowTime);
    return mat;
  }, [isStar, world.type, world.palette, world.glow, flowTime]);
  const starHandles = useMemo(
    () => (isStar ? makeStarMaterial(world.palette[0]) : null),
    [isStar, world.palette],
  );
  const atmosphere = useMemo(
    () => (isStar ? null : makeAtmosphereMaterial(world.glow)),
    [isStar, world.glow],
  );
  const ringTex = useMemo(
    () => (world.ring ? makeRingTexture(world.glow) : null),
    [world.ring, world.glow],
  );
  const ringShadowTex = useMemo(
    () => (world.ring ? makeRingShadowTexture() : null),
    [world.ring],
  );
  const moons = MOON_DEFS[world.id];
  const rocks = useMemo(
    () =>
      world.ring
        ? ringRocks(ROCK_COUNT, world.radius * 1.5, world.radius * 2.45)
        : null,
    [world.ring, world.radius],
  );

  // compose the belt's instance matrices once — the rocks then ride the ring group for free
  useLayoutEffect(() => {
    const mesh = rocksRef.current;
    if (!mesh || !rocks) return;
    const m = new Matrix4();
    const q = new Quaternion();
    const e = new Euler();
    const p = new Vector3();
    const sc = new Vector3();
    rocks.forEach((rock, i) => {
      e.set(rock.tumbleX, rock.tumbleY, 0);
      q.setFromEuler(e);
      p.set(rock.x, rock.y, rock.z);
      sc.setScalar(rock.scale);
      m.compose(p, q, sc);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [rocks]);

  useFrame((state) => {
    const group = groupRef.current;
    const m = metricsRef.current;
    if (!store || !group || !m) return;
    const rect = m.rects[world.id];
    if (!rect) {
      group.visible = false;
      return;
    }
    const s = store.getState();
    const t = state.clock.elapsedTime;
    const vh = m.viewport;
    const scrollY = s.progress * m.scrollable;
    const [ox, oy, oz] = world.position;

    let presence: number;
    let py: number;
    let pz: number;
    let ringLocal = 0;

    if (world.id === 'hero') {
      // symmetric fade about the hero's centre; parked at its own scroll depth so it recedes as you go
      const center = rect.top + rect.height / 2;
      const vc = scrollY + vh / 2;
      const norm = Math.abs((vc - center) / (vh * 1.05));
      presence = smoothstep(1.05, 0, norm);
      py = -((center - vh / 2) / m.scrollable) * TOTAL_TRAVEL + oy;
      pz = oz + presence * presence * 165;
    } else {
      const local = localProgress(scrollY, rect.top, rect.height, vh);
      const pres = planetPresence(local);
      presence = pres.presence;
      const floatB = Math.sin(t * 0.5 + world.radius) * 5;
      py = cameraY(s.progress) + oy + floatB + pres.y;
      pz = oz + pres.z;
      ringLocal = local;
    }

    // the reference never culls a planet — an opaque core parked off-screen + fog hide undocked
    // worlds, while a faint corona/halo lets distant worlds glimmer; we keep a near-zero cull only
    // as a perf guard for truly-parked sections (presence exactly 0)
    group.visible = presence > 0.0005;
    if (!group.visible) return;
    // x contracts toward centre as the world docks (reference off[0] · (1 − pres·0.28))
    group.position.set(ox * (1 - presence * 0.28), py, pz);
    group.scale.setScalar(0.78 + 0.36 * presence);
    if (spinRef.current)
      spinRef.current.rotation.y += 0.0015 + 0.0012 * presence;
    // cores stay opaque (reference); the arrival read comes from position + the additive
    // corona/halo brightening below, not from fading the surface
    if (coronaRef.current) coronaRef.current.opacity = 0.14 + 0.82 * presence;
    // reference halo opacity (`Sanad Landing.dc.html:974`). It was dialled down (0.04+0.3) to fight
    // the r171 bloom's wide haze; with the vendored r128 pass the wide glow stays bounded, so we
    // restore the design's full halo — it's what bathes each docked world in its own light.
    if (haloRef.current) haloRef.current.opacity = 0.05 + 0.5 * presence;
    if (ringGroupRef.current)
      ringGroupRef.current.rotation.z = ringLocal * Math.PI * 1.5;

    // 8.B-4 Stage 1 — surface life (all frozen under reduced motion / calm mode)
    const life = gasFlowTime(t, s.reducedMotion);
    flowTime.value = life;
    if (starHandles) starHandles.time.value = life;
    if (atmosphere) atmosphere.intensity.value = atmosphereIntensity(presence);
    if (rayARef.current) {
      rayARef.current.rotation = starRayRotation(t, 0, s.reducedMotion);
      rayARef.current.opacity = 0.06 + 0.18 * presence;
    }
    if (rayBRef.current) {
      rayBRef.current.rotation = starRayRotation(t, 1, s.reducedMotion);
      rayBRef.current.opacity = 0.05 + 0.14 * presence;
    }
    if (promGroupRef.current && promMatRef.current) {
      const prom = prominenceState(life);
      promGroupRef.current.visible = prom.opacity > 0.01;
      promGroupRef.current.rotation.z = prom.angle;
      promMatRef.current.opacity = prom.opacity * (0.12 + 0.38 * presence);
    }
    if (moonsRef.current && moons) {
      moonsRef.current.children.forEach((moon, i) => {
        const def = moons[i];
        if (!def) return;
        const pos = moonOrbitPosition(def, t, s.reducedMotion);
        moon.position.set(pos.x, pos.y, pos.z);
      });
    }
  });

  return (
    <group ref={groupRef} visible={false}>
      {isStar && starHandles ? (
        <>
          <mesh ref={spinRef} material={starHandles.material}>
            <sphereGeometry args={[world.radius, SEGMENTS, RINGS]} />
          </mesh>
          <sprite scale={world.radius * 5.4}>
            <spriteMaterial
              ref={coronaRef}
              map={glowTex}
              color={glowColor}
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
              fog={false}
            />
          </sprite>
          {/* anisotropic corona — two counter-rotating ray fans shimmer over the plasma */}
          <sprite scale={world.radius * 6}>
            <spriteMaterial
              ref={rayARef}
              map={rayTex}
              color={glowColor}
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
              fog={false}
            />
          </sprite>
          <sprite scale={world.radius * 5.1}>
            <spriteMaterial
              ref={rayBRef}
              map={rayTex}
              color={glowColor}
              transparent
              opacity={0}
              depthWrite={false}
              blending={AdditiveBlending}
              fog={false}
            />
          </sprite>
          {/* a prominence arc rises off the limb every cycle, re-anchored by the golden angle */}
          <group ref={promGroupRef} visible={false}>
            <mesh position={[world.radius * 1.02, 0, 0]}>
              <torusGeometry
                args={[world.radius * 0.16, world.radius * 0.016, 8, 40, 2.4]}
              />
              <meshBasicMaterial
                ref={promMatRef}
                color={glowColor}
                transparent
                opacity={0}
                blending={AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          </group>
        </>
      ) : (
        <>
          <mesh ref={spinRef} material={surfaceMat ?? undefined}>
            <sphereGeometry args={[world.radius, SEGMENTS, RINGS]} />
          </mesh>
          {/* fresnel limb atmosphere (8.B-4) — replaces the reference's flat BackSide shell */}
          {atmosphere ? (
            <mesh material={atmosphere.material}>
              <sphereGeometry args={[world.radius * 1.13, SEGMENTS, RINGS]} />
            </mesh>
          ) : null}
        </>
      )}

      <sprite scale={world.radius * 4.4} position={[0, 0, -world.radius * 0.7]}>
        <spriteMaterial
          ref={haloRef}
          map={glowTex}
          color={glowColor}
          transparent
          opacity={0}
          depthWrite={false}
          blending={AdditiveBlending}
          fog={false}
        />
      </sprite>

      {world.ring && ringTex ? (
        <group ref={ringGroupRef} rotation={[Math.PI * 0.47, 0.34, 0]}>
          <mesh>
            <ringGeometry
              args={[world.radius * 1.46, world.radius * 2.55, SEGMENTS * 2, 1]}
            />
            <meshBasicMaterial
              map={ringTex}
              color={glowColor}
              transparent
              opacity={0.5}
              side={DoubleSide}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          <mesh>
            <ringGeometry
              args={[
                world.radius * 1.46,
                world.radius * 1.46 +
                  (world.radius * 2.55 - world.radius * 1.46) * 0.16,
                SEGMENTS * 2,
                1,
              ]}
            />
            <meshBasicMaterial
              color={glowColor}
              transparent
              opacity={0.85}
              side={DoubleSide}
              blending={AdditiveBlending}
              depthWrite={false}
            />
          </mesh>
          {/* the particulate belt turns with the scrubbed ring at zero per-frame cost */}
          {rocks ? (
            <instancedMesh
              ref={rocksRef}
              args={[undefined, undefined, rocks.length]}
            >
              <icosahedronGeometry args={[1.4, 0]} />
              <meshStandardMaterial
                color={new Color(...world.palette[2])}
                emissive={new Color(...world.glow).multiplyScalar(0.04)}
                roughness={1}
                metalness={0}
              />
            </instancedMesh>
          ) : null}
        </group>
      ) : null}

      {/* the planet's sun-cast shadow across the ring — tilted like the ring, but never scrubbed */}
      {world.ring && ringShadowTex ? (
        <mesh rotation={[Math.PI * 0.47, 0.34, 0]} position={[0, 0, 0.5]}>
          <ringGeometry
            args={[world.radius * 1.46, world.radius * 2.55, SEGMENTS * 2, 1]}
          />
          <meshBasicMaterial
            map={ringShadowTex}
            transparent
            opacity={0.55}
            side={DoubleSide}
            depthWrite={false}
          />
        </mesh>
      ) : null}

      {moons ? (
        <group ref={moonsRef}>
          {moons.map((def, i) => (
            <mesh key={i}>
              <sphereGeometry args={[def.size, 24, 16]} />
              <meshStandardMaterial
                color={new Color(...world.palette[0])}
                emissive={new Color(...world.glow).multiplyScalar(0.03)}
                roughness={1}
                metalness={0}
              />
            </mesh>
          ))}
        </group>
      ) : null}
    </group>
  );
}

export function WorldPlanets() {
  const glowTex = useMemo(() => makeGlowTexture(), []);
  const rayTex = useMemo(() => makeRayTexture(), []);
  const metricsRef = useSectionMetrics();
  return (
    <group>
      {WORLD_DEFS.map((world) => (
        <Planet
          key={world.id}
          world={world}
          metricsRef={metricsRef}
          glowTex={glowTex}
          rayTex={rayTex}
        />
      ))}
    </group>
  );
}
