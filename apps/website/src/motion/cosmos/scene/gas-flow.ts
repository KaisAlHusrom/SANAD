import type { IUniform, Material } from 'three';

/**
 * The living gas-band surface (8.B-4 Stage 1b) — an `onBeforeCompile` patch that swaps the standard
 * material's map sampling for a **time-driven domain warp**: the whole band system drifts slowly
 * while two sine shears at different frequencies make the bands flow against each other (the storm
 * rides the warp with them). Patching `meshStandardMaterial` (instead of a custom shader) keeps the
 * scene's lighting, fog, and emissive exactly as the reference renders them. The `uFlowTime`
 * uniform is fed `gasFlowTime` (frozen at 0 under reduced motion, WEB4 — the surface then shows its
 * authored texture, byte-identical to a static map). Texture X wraps (`RepeatWrapping`), so the
 * drift never shows a seam. If a future three version renames `map_fragment`/`vMapUv`, the replace
 * is a no-op and the surface simply stays static — degrade, never break.
 */

export const GAS_FLOW_MAP_FRAGMENT = /* glsl */ `
#ifdef USE_MAP
  vec2 sanadFlowUv = vMapUv;
  sanadFlowUv.x += uFlowTime * 0.004;
  sanadFlowUv.x += sin(sanadFlowUv.y * 24.0 + uFlowTime * 0.22) * 0.006;
  sanadFlowUv.x += sin(sanadFlowUv.y * 7.0 - uFlowTime * 0.13) * 0.010;
  vec4 sampledDiffuseColor = texture2D( map, sanadFlowUv );
  diffuseColor *= sampledDiffuseColor;
#endif
`;

export function applyGasFlow(material: Material, time: IUniform<number>): void {
  material.onBeforeCompile = (shader) => {
    shader.uniforms['uFlowTime'] = time;
    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        '#include <common>\nuniform float uFlowTime;',
      )
      .replace('#include <map_fragment>', GAS_FLOW_MAP_FRAGMENT);
  };
  // all gas planets share this one patched program (uniforms stay per-material)
  material.customProgramCacheKey = () => 'sanad-gas-flow';
}
