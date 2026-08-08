import { hexToTriplet } from '../worlds';
import { TOTAL_TRAVEL } from '../math';

/**
 * Build one parallax star layer as flat position + colour buffers (fed straight to a `<points>`
 * bufferGeometry). Ported from the reference `makeParticleLayer`: stars scatter **radially** in the
 * X/Z plane (`r = √random · spread`) and spread the whole flight length in **Y**, so the layer is
 * fixed in the world and the camera **streams through it** as it flies — the endless-field read. Each
 * star is tinted from the layer palette and dimmed a random amount. `Math.random` is fine here (the
 * U6 runtime carve-out — a star field needs no determinism).
 */
export function makeStarfield(
  count: number,
  spread: number,
  colors: readonly string[],
): { positions: Float32Array; colors: Float32Array } {
  const positions = new Float32Array(count * 3);
  const cols = new Float32Array(count * 3);
  const triplets = colors.map(hexToTriplet);
  for (let i = 0; i < count; i++) {
    const r = Math.sqrt(Math.random()) * spread;
    const a = Math.random() * Math.PI * 2;
    positions[i * 3] = Math.cos(a) * r;
    // spread down the flight (−Y) so the camera passes an endless stream of stars
    positions[i * 3 + 1] = 250 - Math.random() * (TOTAL_TRAVEL + 500);
    positions[i * 3 + 2] = Math.sin(a) * r;
    const base = triplets[(Math.random() * triplets.length) | 0] ?? [1, 1, 1];
    const dim = 0.6 + Math.random() * 0.6;
    cols[i * 3] = base[0] * dim;
    cols[i * 3 + 1] = base[1] * dim;
    cols[i * 3 + 2] = base[2] * dim;
  }
  return { positions, colors: cols };
}
