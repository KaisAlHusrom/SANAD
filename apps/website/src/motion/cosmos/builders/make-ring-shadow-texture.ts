import { CanvasTexture, type Texture } from 'three';

/**
 * The planet's shadow across its ring (8.B-4 Stage 2a) — a soft dark sector painted into an
 * otherwise transparent square, mapped onto a full annulus that sits a hair above the additive ring
 * and, unlike the ring, **never turns with the scroll scrub** (a shadow is cast by the sun, not by
 * the ring's spin). Three nested sectors fake the penumbra. The sector points away from the scene
 * sun (up-left in view), i.e. down-right in ring space — an art call verified by looking (U21e),
 * not a physical projection.
 */
export function makeRingShadowTexture(size = 256): Texture {
  if (typeof document === 'undefined')
    return new CanvasTexture(undefined as never);
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const x = canvas.getContext('2d');
  if (!x) return new CanvasTexture(canvas);

  const half = size / 2;
  // anti-sun heading in ring plane (sun sits up-left — `scene-lighting.tsx`)
  const center = -0.62;
  const sectors: readonly (readonly [number, number])[] = [
    [0.5, 0.45],
    [0.78, 0.28],
    [1.1, 0.16],
  ];
  x.fillStyle = '#000000'; // a shadow mask (alpha does the work) — WebGL render value, not a token
  for (const [halfWidth, alpha] of sectors) {
    x.globalAlpha = alpha;
    x.beginPath();
    x.moveTo(half, half);
    x.arc(half, half, half, center - halfWidth, center + halfWidth);
    x.closePath();
    x.fill();
  }
  return new CanvasTexture(canvas);
}
