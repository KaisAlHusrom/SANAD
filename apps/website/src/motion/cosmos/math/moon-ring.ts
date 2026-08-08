import { smoothstep } from './smoothstep';

/**
 * The process "moons" ring — four phase-moons orbiting the docked process planet, the active one
 * riding to the top-centre and glowing largest. `activeFloat` (0…n−1, from local scroll) slides the
 * whole ring so each phase docks in turn; the nearest integer is the active moon. RTL flips the
 * orbit direction via `dir` (WEB6). `moonRingVisibility` gates the ring so it only appears while the
 * planet is docked. Pure/testable; the overlay applies these as inline transforms (transform-only).
 */

export interface MoonPlacement {
  x: number;
  y: number;
  scale: number;
  depth: number;
  active: boolean;
}

const FOCUS = -Math.PI / 2; // top of the ring
const RY_RATIO = 0.42; // the ellipse is flatter than it is wide
const Y_NUDGE = 40; // drop the whole ring below the planet's centre
const ACTIVE_GAIN = 1.4;

// Named `moonRingPosition` (not `moonPosition`) to avoid colliding with `moon-orbit`'s
// `moonPosition` when both are re-exported through the `math` barrel (TS2308).
export function moonRingPosition(
  index: number,
  count: number,
  activeFloat: number,
  rx: number,
  dir: 1 | -1 = 1,
): MoonPlacement {
  const step = (Math.PI * 2) / count;
  const angle = FOCUS + (index - activeFloat) * step * dir;
  const ry = RY_RATIO * rx;
  const x = Math.cos(angle) * rx;
  const y = Math.sin(angle) * ry + Y_NUDGE;
  // top of the ring (sin −1) reads as nearest/front → largest
  const depth = (1 - Math.sin(angle)) / 2;
  const wrapped = ((Math.round(activeFloat) % count) + count) % count;
  const active = wrapped === ((index % count) + count) % count;
  const scale = (0.5 + 0.72 * depth) * (active ? ACTIVE_GAIN : 1);
  return { x, y, scale, depth, active };
}

/** The ring only shows while the process planet is docked (fades in, holds, fades out). */
export function moonRingVisibility(local: number): number {
  return smoothstep(0.32, 0.46, local) * (1 - smoothstep(0.84, 1, local));
}
