import { CanvasTexture, type Texture } from 'three';

/**
 * The anisotropic corona-ray sprite for the star worlds (8.B-4 Stage 1) — six tapered spikes
 * radiating from a bright centre, white so the sprite material tints it to the star's glow. Two of
 * these sprites counter-rotate over the star (`starRayRotation`) so its corona shimmers instead of
 * reading as one rigid cross. Built once; SSR-safe fallback like the other builders.
 */
export function makeRayTexture(size = 256): Texture {
  if (typeof document === 'undefined')
    return new CanvasTexture(undefined as never);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const x = canvas.getContext('2d');
  if (!x) return new CanvasTexture(canvas);

  const half = size / 2;
  x.translate(half, half);
  const rays = 6;
  for (let i = 0; i < rays; i++) {
    x.save();
    x.rotate((i / rays) * Math.PI * 2);
    const grad = x.createLinearGradient(0, 0, 0, half);
    grad.addColorStop(0, 'rgba(255,255,255,0.85)');
    grad.addColorStop(0.35, 'rgba(255,255,255,0.28)');
    grad.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = grad;
    x.beginPath();
    x.moveTo(-size * 0.016, 0);
    x.lineTo(size * 0.016, 0);
    x.lineTo(0, half * 0.98);
    x.closePath();
    x.fill();
    x.restore();
  }
  // a soft core so the spikes emerge from light, not a point
  const core = x.createRadialGradient(0, 0, 0, 0, 0, size * 0.12);
  core.addColorStop(0, 'rgba(255,255,255,0.9)');
  core.addColorStop(1, 'rgba(255,255,255,0)');
  x.fillStyle = core;
  x.beginPath();
  x.arc(0, 0, size * 0.12, 0, 7);
  x.fill();

  return new CanvasTexture(canvas);
}
