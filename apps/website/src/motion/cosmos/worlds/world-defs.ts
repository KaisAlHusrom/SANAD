import { landingWorldOrder, landingWorlds } from '@sanad/config';
import type { ColorTriplet, PlanetType, WorldDef } from '../types';

/**
 * The nine cosmos worlds as the scene consumes them (WEB10). The design colours/sizes come from
 * `@sanad/config` `landingWorlds` (the single source of truth, U6); this layer adds the
 * **runtime-only** scene placement (the 3D offset each planet docks at — genuine per-frame
 * coordinates, the U6 carve-out) and converts every hex colour to a normalized RGB triplet **once
 * at module load** so the scene builds a `THREE.Color` per frame with no parsing. CSS custom
 * properties are awkward inside WebGL, so the scene reads these typed constants while the DOM veil/
 * footer read the same `landingWorlds` hex — one colour source, WebGL + DOM locked.
 */

/**
 * Where each planet sits in the scene relative to the flight path (runtime coordinates, the U6
 * carve-out). `[x, yBias, z]`, locked from the reference prototype's `off` values
 * (`Sanad Landing.dc.html:461-471`).
 */
const POSITIONS: Record<string, readonly [number, number, number]> = {
  hero: [-185, -150, -300],
  trust: [250, 0, -150],
  services: [-255, 0, -120],
  process: [0, -30, -60],
  // works planet docks close (z −30) so the case-study cards orbit right around it (WEB10 spine)
  works: [0, 0, -30],
  stats: [-238, 0, -150],
  testimonials: [244, 0, -160],
  blog: [-242, 0, -150],
  cta: [0, 0, -120],
};

/** Parse a `#rrggbb` hex into a normalized RGB triplet (0..1). */
export function hexToTriplet(hex: string): ColorTriplet {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

export const WORLD_DEFS: readonly WorldDef[] = landingWorldOrder.map((id) => {
  const w = landingWorlds[id];
  return {
    id,
    glow: hexToTriplet(w.glow),
    fog: hexToTriplet(w.fog),
    palette: [
      hexToTriplet(w.palette[0]),
      hexToTriplet(w.palette[1]),
      hexToTriplet(w.palette[2]),
    ],
    type: w.type as PlanetType,
    radius: w.radius,
    ring: w.ring,
    position: POSITIONS[id] ?? [0, 0, -100],
  };
});

/** The per-world fog tints in scroll order — fed to `worldColorAt` for the scene fog + clear colour. */
export const WORLD_FOGS: readonly ColorTriplet[] = WORLD_DEFS.map((w) => w.fog);

/** The per-world glow colours in scroll order — fed to `worldColorAt` for fog/veil/sun. */
export const WORLD_GLOWS: readonly ColorTriplet[] = WORLD_DEFS.map(
  (w) => w.glow,
);
