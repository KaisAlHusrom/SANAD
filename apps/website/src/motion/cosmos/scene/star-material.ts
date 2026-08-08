import { Color, ShaderMaterial, type IUniform } from 'three';
import type { ColorTriplet } from '../types';

/**
 * The living plasma surface for the star worlds (8.B-4 Stage 1d) — replaces the reference's flat
 * `meshBasicMaterial` core with slow domain-warped 3D value noise graded from the star's core shade
 * toward a near-white hot shade, plus gentle limb darkening. Sampled from the **object-space
 * position** (not UV) so there is no texture seam and the mesh's idle spin carries the surface.
 * Mean luminance stays at the palette core so the locked r128 bloom (WEB11) blows it out exactly as
 * before — the plasma is what you see *inside* the glow. `uTime` is fed `gasFlowTime` (frozen under
 * reduced motion, WEB4).
 */

const VERTEX = /* glsl */ `
varying vec3 vPos;
varying vec3 vNormalV;
varying vec3 vViewV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPos = position;
  vNormalV = normalMatrix * normal;
  vViewV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = /* glsl */ `
uniform float uTime;
uniform vec3 uCore;
uniform vec3 uHot;
varying vec3 vPos;
varying vec3 vNormalV;
varying vec3 vViewV;

float hash(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453);
}
float noise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(hash(i), hash(i + vec3(1.0, 0.0, 0.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 0.0)), hash(i + vec3(1.0, 1.0, 0.0)), f.x), f.y),
    mix(mix(hash(i + vec3(0.0, 0.0, 1.0)), hash(i + vec3(1.0, 0.0, 1.0)), f.x),
        mix(hash(i + vec3(0.0, 1.0, 1.0)), hash(i + vec3(1.0, 1.0, 1.0)), f.x), f.y),
    f.z);
}
float fbm(vec3 p) {
  return 0.55 * noise(p) + 0.3 * noise(p * 2.4) + 0.15 * noise(p * 5.3);
}

void main() {
  vec3 p = normalize(vPos) * 3.2;
  vec3 drift = vec3(uTime * 0.03, -uTime * 0.02, uTime * 0.014);
  float warp = fbm(p + drift * 0.5);
  float n = fbm(p + drift + vec3(warp * 0.7));
  vec3 col = mix(uCore, uHot, smoothstep(0.3, 0.82, n));
  float limb = 0.72 + 0.28 * clamp(dot(normalize(vNormalV), normalize(vViewV)), 0.0, 1.0);
  gl_FragColor = vec4(col * limb, 1.0);
}
`;

export interface StarHandles {
  readonly material: ShaderMaterial;
  /** Drive this each frame with `gasFlowTime(elapsed, reducedMotion)`. */
  readonly time: IUniform<number>;
}

export function makeStarMaterial(core: ColorTriplet): StarHandles {
  const time: IUniform<number> = { value: 0 };
  // the cells sink a touch below the core shade; the hot veins lift halfway to white — the mean
  // stays on the palette core so the bloom result matches the flat reference material
  const hot: ColorTriplet = [
    core[0] + (1 - core[0]) * 0.5,
    core[1] + (1 - core[1]) * 0.5,
    core[2] + (1 - core[2]) * 0.5,
  ];
  const material = new ShaderMaterial({
    uniforms: {
      uTime: time,
      uCore: {
        value: new Color(core[0] * 0.85, core[1] * 0.85, core[2] * 0.85),
      },
      uHot: { value: new Color(hot[0], hot[1], hot[2]) },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
  });
  return { material, time };
}
