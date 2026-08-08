/**
 * Scene-level tuning for the cosmos (U18) — the geometry sizes, particle budgets, and post-processing
 * values ported from the reference `cosmos.js`. These are genuine runtime/render values (the U6
 * carve-out): sizes and counts a WebGL scene needs, not design tokens. Colours come from
 * `@sanad/config` `landingWorlds` / `pageAccents` via `worlds/world-defs`.
 */

/** Camera: fixed distance back from the flight axis, field of view, clip planes. */
export const CAMERA = {
  z: 420,
  fov: 60,
  near: 1,
  far: 4000,
} as const;

/** Central "Sanad coin" geometry (radii/tube in world units) + the gem wireframe colour. */
export const COIN = {
  outerRing: { radius: 26, tube: 1.1 },
  midRing: { radius: 19, tube: 0.7 },
  gemRadius: 12,
  haloBaseScale: 0.9, // multiplies the per-frame haloScale from coin math
  leadZ: 30, // nudged forward of the look-at so the coin sits in front of the flight
  gemWire: '#ffffff', // the octahedron's white wireframe (a WebGL render colour)
} as const;

/** The three parallax star layers (count / calm-mode count / point size / spread radius). */
export const STAR_LAYERS = [
  { count: 2400, calm: 900, size: 2.6, spread: 380 },
  { count: 1100, calm: 400, size: 4.4, spread: 330 },
  { count: 420, calm: 160, size: 7.2, spread: 300 },
] as const;

/** Star colours per layer (hex — parsed to THREE.Color in the builder). */
export const STAR_COLORS: readonly (readonly string[])[] = [
  ['#cfeaf6', '#bfe6f2', '#dfeaff'],
  ['#bae6fd', '#a8c6ff', '#e9d5ff'],
  ['#fde68a', '#5eead4', '#c4b5fd'],
];

/** Hyperspace warp streaks. */
export const WARP = {
  maxCount: 150,
  spread: 220, // how far around the camera streaks scatter
  reach: 900, // how far ahead/behind they span the travel axis
} as const;

/**
 * Bloom (glow). The reference renders on raw Three r128 (NoToneMapping + linear output) with three's
 * OWN `UnrealBloomPass`. We render that **exact r128 pass, vendored** (`vendor/postprocessing/`) —
 * NOT `three/examples/jsm`'s r171 pass, which switched the internal render targets to `HalfFloatType`
 * (HDR) and blooms far wider, washing space grey. With the r128 pass these are the **exact reference
 * constructor args**, unchanged: `new UnrealBloomPass(resolution, strength 0.85, radius 0.7,
 * threshold 0.2)`. Deep space stays near-black via the sRGB-tagged fog/clear (`scene-lighting.tsx`)
 * plus r128's 8-bit clamp, so only bright bodies pass the 0.2 threshold and the planet surfaces bloom
 * into glowing orbs like the design. The finale surges `strength` at the impact.
 */
export const BLOOM = {
  strength: 0.85,
  radius: 0.7,
  // Reference threshold. Previously raised to 0.45 to fight the r171 pass's wide haze — but that
  // stopped the planet BODIES from blooming (flat/dim spheres, the owner's complaint). With the
  // vendored r128 pass (8-bit clamp) the reference 0.2 blooms the bodies while space stays black.
  threshold: 0.2,
} as const;

/** Exponential scene fog density (colour is lerped per world each frame) — reference `FogExp2(…, 0.00165)`. */
export const FOG = { density: 0.00165 } as const;
