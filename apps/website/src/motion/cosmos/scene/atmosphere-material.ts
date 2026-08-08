import {
  AdditiveBlending,
  Color,
  FrontSide,
  ShaderMaterial,
  Vector3,
  type IUniform,
} from 'three';
import type { ColorTriplet } from '../types';

/**
 * The fresnel atmosphere shell (8.B-4 Stage 1c) — replaces the reference's flat BackSide glow
 * (`opacity 0.17`, uniform across the disc) with a **view-angle rim**: transparent over the face of
 * the planet, igniting at the limb, brightest on the sun side, so each world reads as a lit body
 * wrapped in air instead of a sphere inside a tinted bubble (owner-approved beyond-parity change).
 * Additive + no depth write like every cosmos glow; intensity is driven per frame from the dock
 * presence (`atmosphereIntensity`). The sun direction matches the scene's directional light.
 */

/** The scene sun's direction (`scene-lighting.tsx` position, normalized) — the lit-limb bias. */
const SUN_DIR = new Vector3(-0.55, 0.42, 0.72).normalize();

const VERTEX = /* glsl */ `
varying vec3 vNormalV;
varying vec3 vNormalW;
varying vec3 vViewV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vNormalV = normalMatrix * normal;
  vNormalW = mat3(modelMatrix) * normal;
  vViewV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform vec3 uSunDir;
varying vec3 vNormalV;
varying vec3 vNormalW;
varying vec3 vViewV;
void main() {
  float facing = clamp(dot(normalize(vNormalV), normalize(vViewV)), 0.0, 1.0);
  float rim = pow(1.0 - facing, 3.0);
  float sun = 0.55 + 0.45 * clamp(dot(normalize(vNormalW), uSunDir), -1.0, 1.0);
  gl_FragColor = vec4(uColor * rim * uIntensity * sun, 1.0);
}
`;

export interface AtmosphereHandles {
  readonly material: ShaderMaterial;
  /** Drive this each frame with `atmosphereIntensity(presence)`. */
  readonly intensity: IUniform<number>;
}

export function makeAtmosphereMaterial(glow: ColorTriplet): AtmosphereHandles {
  const intensity: IUniform<number> = { value: 0 };
  const material = new ShaderMaterial({
    uniforms: {
      uColor: { value: new Color(glow[0], glow[1], glow[2]) },
      uIntensity: intensity,
      uSunDir: { value: SUN_DIR.clone() },
    },
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    side: FrontSide,
  });
  return { material, intensity };
}
