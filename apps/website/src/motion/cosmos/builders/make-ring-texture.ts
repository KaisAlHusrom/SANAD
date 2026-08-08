import { CanvasTexture, RepeatWrapping, type Texture } from 'three';
import type { ColorTriplet } from '../types';

/**
 * The banded alpha texture for a ringed planet's ring (WEB10) — a 256×8 strip whose per-column
 * opacity is noise modulated by a sin² gap pattern, tinted to the world glow. Ported from the
 * reference prototype's `ringTex`. `Math.random` is fine — ring banding needs no determinism (U6
 * runtime carve-out). Returns a transparent fallback during SSR.
 */
export function makeRingTexture(glow: ColorTriplet): Texture {
  if (typeof document === 'undefined')
    return new CanvasTexture(undefined as never);
  const n = 256;
  const canvas = document.createElement('canvas');
  canvas.width = n;
  canvas.height = 8;
  const g = canvas.getContext('2d');
  if (g) {
    const fill = `rgb(${Math.round(glow[0] * 255)},${Math.round(glow[1] * 255)},${Math.round(glow[2] * 255)})`;
    for (let i = 0; i < n; i++) {
      const s = Math.sin(i * 0.35);
      const v = (0.25 + Math.random() * 0.75) * (0.4 + 0.6 * s * s);
      g.globalAlpha = v;
      g.fillStyle = fill;
      g.fillRect(i, 0, 1, 8);
    }
    g.globalAlpha = 1;
  }
  const texture = new CanvasTexture(canvas);
  texture.wrapS = RepeatWrapping;
  return texture;
}
