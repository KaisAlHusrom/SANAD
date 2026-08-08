'use client';

import { useEffect, useMemo, type RefObject } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import {
  LinearFilter,
  RGBAFormat,
  UnsignedByteType,
  Vector2,
  WebGLRenderTarget,
} from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from '../vendor/postprocessing/UnrealBloomPass.js';
import { BLOOM } from '../constants';
import type { BloomHandle } from '../finale';

/**
 * The signature glow (WEB3/WEB11) — the **vendored three r128 `UnrealBloomPass`** (see
 * `vendor/postprocessing/`), the EXACT pass the reference `Sanad Landing.dc.html` renders, so the
 * planet bodies / star cores / coin bloom into glowing orbs identically. We must vendor r128's pass
 * rather than use `three/examples/jsm`'s r171 one: r171 switched the pass's internal render targets
 * to `HalfFloatType` (HDR), which lets additive glow accumulate >1.0 and bloom far WIDER than r128's
 * bounded 8-bit `RGBAFormat` targets — the grey haze that made the team dial the glow down and lose
 * the design's look. With the r128 pass, the reference numbers (strength 0.85 / radius 0.7 /
 * threshold 0.2 in `constants`) match the design pixel-for-pixel. The composer is
 * `RenderPass → UnrealBloomPass` with **no OutputPass** (r128 outputs raw linear); combined with the
 * Canvas `legacy` (ColorManagement off) this reproduces the reference's raw-linear look. It drives
 * the frame at `useFrame` priority 1, so R3F hands rendering to the composer. The pass is captured
 * into `bloomRef` so the finale surges `strength`.
 */
export function CosmosBloom({
  bloomRef,
}: {
  bloomRef: RefObject<BloomHandle | null>;
}) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const size = useThree((s) => s.size);
  const dpr = useThree((s) => s.viewport.dpr);

  const { composer, bloom } = useMemo(() => {
    // r128 parity (the crux of the "grey space" fix): r171's EffectComposer defaults its read/write
    // buffers to `HalfFloatType` (HDR), so the RenderPass feeds the bloom scene values >1.0 and the
    // pass hazes far wider — washing deep space grey — even with the r128 pass. r128's composer used
    // clamped 8-bit `UnsignedByte` buffers, so the bright planet/halo/coin cap at 1.0 before the
    // high-pass and the bloom stays tight on black space. Pass an explicit 8-bit RGBA target to match
    // (linear-stored, since the canvas runs `legacy` = ColorManagement off + `flat` = NoToneMapping).
    const rt = new WebGLRenderTarget(size.width, size.height, {
      type: UnsignedByteType,
      format: RGBAFormat,
      minFilter: LinearFilter,
      magFilter: LinearFilter,
    });
    const c = new EffectComposer(gl, rt);
    c.addPass(new RenderPass(scene, camera));
    const b = new UnrealBloomPass(
      new Vector2(size.width, size.height),
      BLOOM.strength,
      BLOOM.radius,
      BLOOM.threshold,
    );
    c.addPass(b);
    return { composer: c, bloom: b };
    // size is applied via setSize in the effect below; re-creating the composer on resize would drop
    // the ref and re-init the pass — gl/scene/camera are the only true rebuild deps
  }, [gl, scene, camera]);

  useEffect(() => {
    bloomRef.current = bloom;
    return () => {
      bloomRef.current = null;
    };
  }, [bloom, bloomRef]);

  useEffect(() => {
    // size the composer at the real DRAWING-BUFFER resolution (CSS × DPR). EffectComposer.setSize
    // multiplies by its pixelRatio and forwards the effective size to every pass (incl. the bloom),
    // so a retina (DPR 2) buffer isn't bloomed at half-res → blurry wide haze.
    composer.setPixelRatio(dpr);
    composer.setSize(size.width, size.height);
  }, [composer, size, dpr]);

  useEffect(() => () => composer.dispose(), [composer]);

  useFrame(() => {
    composer.render();
  }, 1);

  return null;
}
