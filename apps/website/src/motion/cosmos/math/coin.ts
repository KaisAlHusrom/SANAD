import { smoothstep } from './smoothstep';
import type { CoinTransform } from '../types';

/**
 * The per-frame transform of the central "Sanad coin" (the persistent WEB10 element). It spins
 * slowly (faster as the flight descends), its inner gem counter-rotates, it scales up out of the
 * hero, its halo pulses with scroll-velocity `warp`, and the whole coin sways on an orbit as it
 * travels. `t` is the rAF clock time (N3 — passed in, never `Date.now()`); `progress` is the eased
 * scroll 0→1; `warp` the smoothed velocity; `dir` flips the sway under RTL (WEB6); `sway` is the
 * amplitude (reduced under calm/reduced-motion).
 */

/** Scale grows from 0.78 to 1.0 as the coin clears the hero (first 6% of the flight). */
const HERO_CLEAR = 0.06;
const BASE_SCALE = 0.78;
const SCALE_GAIN = 0.22;
/** Halo pulse: baseline + warp brightening + a slow breathing sine (reference values). */
const HALO_BASE = 118;
const HALO_WARP = 70;
const HALO_BREATH = 8;
/** The coin leads the camera by this much in Z so it stays ahead in the flight. */
const LEAD_Z = 70;
/**
 * Lead-below-camera (reference `oy = camY − 118 − smooth(0,0.05)·10 + heroPhase·72`): the coin hangs
 * ~46 below in the hero, then drops to ~128 below once clear of it — leading the descent toward each
 * world rather than sitting dead-centre.
 */
const LEAD_BELOW_BASE = 118;
const LEAD_BELOW_FLIGHT = 10;
const LEAD_HERO_LIFT = 72;

export function coinTransform(
  t: number,
  progress: number,
  warp: number,
  dir: 1 | -1 = 1,
  sway = 1,
): CoinTransform {
  const d = progress;
  const heroPhase = 1 - smoothstep(0, 0.08, d);
  return {
    // slow spin, quickening with depth
    rotY: t * 0.4 + d * 5,
    // inner gem counter-rotates on two axes
    gemRotY: -t * 0.7,
    gemRotX: t * 0.5,
    scale: BASE_SCALE + smoothstep(0, HERO_CLEAR, progress) * SCALE_GAIN,
    haloScale: HALO_BASE + warp * HALO_WARP + Math.sin(t * 1.5) * HALO_BREATH,
    // orbital sway (mirrored under RTL), Z holding the coin ahead of the camera
    swayX:
      (Math.sin(d * Math.PI * 5 + t * 0.25) * 26 +
        Math.sin(d * Math.PI * 11) * 8) *
      sway *
      dir,
    swayZ: Math.cos(d * Math.PI * 4 + t * 0.2) * 18 * sway + LEAD_Z,
    // below the camera: ~−46 in the hero → ~−128 in flight (leads the descent)
    leadY:
      -LEAD_BELOW_BASE -
      smoothstep(0, 0.05, d) * LEAD_BELOW_FLIGHT +
      heroPhase * LEAD_HERO_LIFT,
  };
}
