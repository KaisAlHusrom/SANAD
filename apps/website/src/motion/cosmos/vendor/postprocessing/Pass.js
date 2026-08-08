// VENDORED VERBATIM from three@0.128.0 examples/jsm/postprocessing/Pass.js
// ---------------------------------------------------------------------------
// Why this lives here (WEB3/WEB11): the landing cosmos glow is calibrated to the
// reference `Sanad Landing.dc.html`, which renders on three **r128**. Our app ships
// three **r171**, whose UnrealBloomPass switched its internal render targets to
// `HalfFloatType` (HDR) — additive glow layers then accumulate values >1.0 and bloom
// far WIDER than r128's 8-bit `RGBAFormat` targets, washing deep space grey. The team
// previously compensated by dialling every glow input down (threshold up, halo/veil
// down), which killed the design's glowing-orb look. Vendoring r128's exact pass (this
// file + CopyShader + LuminosityHighPassShader + UnrealBloomPass) reproduces the
// reference's bounded, tight bloom so the reference numbers (strength 0.85 / radius 0.7
// / threshold 0.2) match the design pixel-for-pixel. This directory is excluded from
// lint (see apps/website/eslint.config.mjs) as upstream third-party source.
import {
  BufferGeometry,
  Float32BufferAttribute,
  OrthographicCamera,
  Mesh,
} from 'three';

class Pass {
  constructor() {
    // r171-compat: three r171's `Pass` base sets `isPass = true` and its `EffectComposer.addPass`
    // type requires it. The reference r128 pass predates it; adding this inert marker keeps the
    // vendored pass structurally assignable to r171's `Pass` without touching any render logic.
    this.isPass = true;

    // if set to true, the pass is processed by the composer
    this.enabled = true;

    // if set to true, the pass indicates to swap read and write buffer after rendering
    this.needsSwap = true;

    // if set to true, the pass clears its buffer before rendering
    this.clear = false;

    // if set to true, the result of the pass is rendered to screen. This is set automatically by EffectComposer.
    this.renderToScreen = false;
  }

  setSize(/* width, height */) {}

  render(/* renderer, writeBuffer, readBuffer, deltaTime, maskActive */) {
    console.error('THREE.Pass: .render() must be implemented in derived pass.');
  }
}

// Helper for passes that need to fill the viewport with a single quad.

const _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

// https://github.com/mrdoob/three.js/pull/21358

const _geometry = new BufferGeometry();
_geometry.setAttribute(
  'position',
  new Float32BufferAttribute([-1, 3, 0, -1, -1, 0, 3, -1, 0], 3),
);
_geometry.setAttribute('uv', new Float32BufferAttribute([0, 2, 0, 0, 2, 0], 2));

class FullScreenQuad {
  constructor(material) {
    this._mesh = new Mesh(_geometry, material);
  }

  dispose() {
    this._mesh.geometry.dispose();
  }

  render(renderer) {
    renderer.render(this._mesh, _camera);
  }

  get material() {
    return this._mesh.material;
  }

  set material(value) {
    this._mesh.material = value;
  }
}

export { Pass, FullScreenQuad };
