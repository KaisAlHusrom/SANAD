import { CanvasTexture, type Texture } from 'three';

/**
 * The star point sprite — a **crisp** radial gradient (bright core, fast falloff) matching the
 * reference `cosmos.js` star texture (`1.0 → 0.85@0.25 → 0.25@0.55 → 0@1`). Distinct from the soft
 * `makeGlowTexture` halo (which is for the coin + planet coronas): reusing the halo made stars read
 * as dim, blurry dust rather than sharp points of light. Built once on the client (canvas-only, so
 * `document` exists); returns a transparent fallback during SSR so nothing throws.
 */
export function makeStarTexture(size = 64): Texture {
  if (typeof document === 'undefined')
    return new CanvasTexture(undefined as never);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const half = size / 2;
    const gradient = ctx.createRadialGradient(half, half, 0, half, half, half);
    gradient.addColorStop(0, 'rgba(255,255,255,1)');
    gradient.addColorStop(0.25, 'rgba(255,255,255,0.85)');
    gradient.addColorStop(0.55, 'rgba(255,255,255,0.25)');
    gradient.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }
  return new CanvasTexture(canvas);
}
