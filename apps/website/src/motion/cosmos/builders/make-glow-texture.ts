import { CanvasTexture, type Texture } from 'three';

/**
 * A soft radial-gradient sprite texture (white core → transparent) for the coin halo + planet
 * coronas — the reference's glow sprite. Built once on the client (the scene is canvas-only, so
 * `document` exists); returns a transparent 1×1 fallback texture during SSR so nothing throws.
 */
export function makeGlowTexture(size = 128): Texture {
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
