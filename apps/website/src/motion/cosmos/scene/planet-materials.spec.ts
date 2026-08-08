import { describe, expect, it } from 'vitest';
import { AdditiveBlending, MeshStandardMaterial } from 'three';
import { makeAtmosphereMaterial } from './atmosphere-material';
import { makeStarMaterial } from './star-material';
import { GAS_FLOW_MAP_FRAGMENT, applyGasFlow } from './gas-flow';

const GLOW = [0.13, 0.83, 0.93] as const;
const CORE = [0.34, 0.81, 0.93] as const;

describe('makeAtmosphereMaterial (fresnel limb shell)', () => {
  it('builds an additive, non-depth-writing shell with a live intensity handle', () => {
    const atm = makeAtmosphereMaterial(GLOW);
    expect(atm.material.transparent).toBe(true);
    expect(atm.material.depthWrite).toBe(false);
    expect(atm.material.blending).toBe(AdditiveBlending);
    expect(atm.material.uniforms['uIntensity']).toBe(atm.intensity);
    expect(atm.material.uniforms['uColor']).toBeDefined();
    expect(atm.material.uniforms['uSunDir']).toBeDefined();
    atm.intensity.value = 0.7;
    expect(atm.material.uniforms['uIntensity']?.value).toBe(0.7);
  });

  it('shades a view-angle rim, not a flat shell', () => {
    const atm = makeAtmosphereMaterial(GLOW);
    expect(atm.material.fragmentShader).toContain('pow(');
    expect(atm.material.fragmentShader).toContain('uSunDir');
  });
});

describe('makeStarMaterial (plasma surface)', () => {
  it('exposes a live time handle and grades core → hot', () => {
    const star = makeStarMaterial(CORE);
    expect(star.material.uniforms['uTime']).toBe(star.time);
    expect(star.material.uniforms['uCore']).toBeDefined();
    expect(star.material.uniforms['uHot']).toBeDefined();
    star.time.value = 4.2;
    expect(star.material.uniforms['uTime']?.value).toBe(4.2);
  });

  it('is seam-free (3D noise from the object position, not UV)', () => {
    const star = makeStarMaterial(CORE);
    expect(star.material.fragmentShader).toContain('fbm');
    expect(star.material.fragmentShader).not.toContain('vUv');
  });
});

describe('applyGasFlow (living band surfaces)', () => {
  it('patches map sampling with the flow-time uniform and keys the program cache', () => {
    const material = new MeshStandardMaterial();
    const time = { value: 0 };
    applyGasFlow(material, time);
    expect(material.customProgramCacheKey()).toBe('sanad-gas-flow');

    const shader = {
      uniforms: {} as Record<string, { value: number }>,
      vertexShader: '',
      fragmentShader: '#include <common>\n#include <map_fragment>',
    };
    material.onBeforeCompile(shader as never, undefined as never);
    expect(shader.uniforms['uFlowTime']).toBe(time);
    expect(shader.fragmentShader).toContain('uniform float uFlowTime;');
    expect(shader.fragmentShader).toContain(GAS_FLOW_MAP_FRAGMENT.trim());
    expect(shader.fragmentShader).not.toContain('#include <map_fragment>');
  });
});
