import { hash01 } from './smoothstep';

/**
 * The particulate ring belt (8.B-4 Stage 2a) — deterministic rock transforms scattered through the
 * ring annulus by a golden-angle walk (even coverage, no clumps, no `Math.random`). Positions are in
 * the ring group's local XY plane (`ringGeometry`'s plane), so parenting the instanced mesh to the
 * ring group makes the whole belt turn with the scroll-scrubbed ring at **zero per-frame cost** —
 * the matrices are composed once.
 */

/** Golden angle (rad). */
const GOLDEN_ANGLE = 2.399963229728653;

export interface RingRock {
  /** Ring-plane position (the ring group tilts the plane). */
  readonly x: number;
  readonly y: number;
  /** Small out-of-plane jitter so the belt has thickness. */
  readonly z: number;
  /** Uniform instance scale (world units). */
  readonly scale: number;
  /** Static tumble orientation (rad). */
  readonly tumbleX: number;
  readonly tumbleY: number;
}

export function ringRocks(
  count: number,
  innerRadius: number,
  outerRadius: number,
): RingRock[] {
  const rocks: RingRock[] = [];
  for (let i = 0; i < count; i++) {
    const angle = i * GOLDEN_ANGLE;
    const radius =
      innerRadius + (outerRadius - innerRadius) * hash01(i * 7 + 1);
    rocks.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: (hash01(i * 7 + 2) - 0.5) * 4,
      scale: 0.9 + hash01(i * 7 + 3) * 1.9,
      tumbleX: hash01(i * 7 + 4) * Math.PI * 2,
      tumbleY: hash01(i * 7 + 5) * Math.PI * 2,
    });
  }
  return rocks;
}
