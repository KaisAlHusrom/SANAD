/**
 * Shared strict types for the R3F cosmos (WEB10). No `any`/`unknown` (U4) — every Three object,
 * world definition, and per-frame scalar bundle is typed. Colors cross the WebGL boundary as
 * normalized RGB triplets (0..1) so they build a `THREE.Color` with no per-frame parsing.
 */

/** A normalized RGB colour, each channel 0..1 — cheap to hand to `THREE.Color`. */
export type ColorTriplet = readonly [r: number, g: number, b: number];

/** The visual archetype of a per-section planet (drives shading in the scene, not the math). */
export type PlanetType = 'star' | 'gas' | 'ice' | 'rocky';

/**
 * One of the nine section "worlds" the flight travels through. `glow`/`palette` are the locked
 * design colours (from `@sanad/config` `landingWorlds`); `position`/`radius`/`ring` place and size
 * the planet in the scene; `type` selects its shading.
 */
export interface WorldDef {
  readonly id: string;
  readonly glow: ColorTriplet;
  /** Deep-space fog tint for this section (scene fog + clear colour) — distinct from `glow`. */
  readonly fog: ColorTriplet;
  readonly palette: readonly [ColorTriplet, ColorTriplet, ColorTriplet];
  readonly type: PlanetType;
  readonly radius: number;
  readonly ring: boolean;
  readonly position: readonly [number, number, number];
}

/** The docked-ness + transform of a single planet at a given local scroll position. */
export interface PresenceState {
  /** 0 (absent) … 1 (fully docked at viewport centre). */
  readonly presence: number;
  readonly opacity: number;
  /** World-space Y offset (lifts up on exit). */
  readonly y: number;
  /** World-space Z offset (rises from deep on arrival, recedes on exit). */
  readonly z: number;
  readonly scale: number;
  /** Gentle idle spin accrued while docked. */
  readonly rotate: number;
}

/** The per-frame transform of the central "Sanad coin". */
export interface CoinTransform {
  readonly rotY: number;
  readonly gemRotY: number;
  readonly gemRotX: number;
  readonly scale: number;
  readonly haloScale: number;
  readonly swayX: number;
  readonly swayZ: number;
  /**
   * World-space Y offset **below the camera** (always negative) — the coin leads the descent,
   * sitting a little below in the hero and dropping further ahead once the flight is underway, so it
   * reads as a traveler streaking down toward each world (reference `oy = camY − …`).
   */
  readonly leadY: number;
}
