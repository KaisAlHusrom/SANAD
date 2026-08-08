/**
 * Geometry/tuning for the per-system scenes (P8.D) — genuine WebGL runtime values
 * (the U6 carve-out), colocated per U18. Colors always come from the token-derived
 * `SYSTEM_FOGS`/`SYSTEM_ACCENTS`/`universeSystems` palettes, never literals here.
 */

/** Subtle camera descent across a full non-landing page scroll (world units). */
export const SYSTEM_SCROLL_TRAVEL = 140;

/** The services "Constellation": an anchor star with the service worlds on a slow ring. */
export const CONSTELLATION = {
  STAR: { x: 0, y: 46, z: -90, coreScale: 170, rayScale: 250, raySpin: 0.05 },
  RING: { radius: 215, worlds: 5, x: 0, y: -6, z: -30 },
  WORLD_RADII: [22, 17, 19, 15, 20],
  WORLD_TYPES: ['gas', 'ice', 'rocky', 'gas', 'ice'],
  LINES: { base: 0.07, pulse: 0.05, speed: 0.6 },
  SPIN: { time: 0.02, scroll: 0.5 },
} as const;

/** The serviceDetail "Close Orbit": one large seeded planet, ring + moons. */
export const CLOSE_ORBIT = {
  PLANET: { radius: 115, x: 165, y: -26, z: 20, tilt: 0.18 },
  HALO: { scale: 3.1, opacity: 0.17 },
  /** The ring lies near-flat in the equatorial plane, seed-tilted subtly toward the camera —
      tighter + dimmer than the landing recipe because this planet fills half the frame. */
  RING: {
    inner: 1.3,
    outer: 1.85,
    opacity: 0.38,
    segments: 128,
    tiltScale: 0.35,
  },
  MOON: { radius: 12, orbit: 200, squash: 0.34 },
} as const;

/** The contact "Beacon": a small emerald relay pulsing signal rings into calm space. */
export const BEACON = {
  CORE: { x: 0, y: 8, z: -70, scale: 46 },
  RAYS: { scale: 132, spin: 0.03 },
  RING_COUNT: 3,
  RING_BASE: 30,
  RING_TILT: -0.95,
  FAR_DOT: { x: 320, y: 96, z: -220, scale: 14, opacity: 0.25 },
} as const;

/** The ambient "Adrift" signature: one faint distant point of light. */
export const AMBIENT_GLOW = {
  x: -260,
  y: 120,
  z: -240,
  scale: 90,
  opacity: 0.12,
} as const;

/**
 * The works "Galaxy" (P8.E): the landing's largest world — one big violet ringed planet held
 * low-centre as the portfolio backdrop, with the case-study "sparks" orbiting it on a wide ring.
 */
export const GALAXY = {
  PLANET: { radius: 150, x: 0, y: -14, z: -55, tilt: 0.2 },
  HALO: { scale: 2.9, opacity: 0.15 },
  /** A real annulus laid near-flat (−π/2) then tilted toward the camera; ×dir under RTL (WEB6). */
  RING: { inner: 1.35, outer: 2.05, opacity: 0.3, segments: 128, tilt: -0.36 },
  /** Case-study points circling the galaxy: count/orbit feed `constellationLayout`; spin+scroll rotate. */
  SPARKS: {
    count: 7,
    orbit: 315,
    scale: 15,
    opacity: 0.9,
    spin: 0.03,
    scroll: 0.5,
  },
} as const;

/**
 * The about "Hearth" (P8.E-2): one steady, unringed teal core — the calmest system (trust and
 * stability, not a journey) — with a thin, near-static ring of small sparks sized off the team.
 */
export const HEARTH = {
  CORE: { radius: 92, x: 0, y: -6, z: -60, tilt: 0.15 },
  HALO: { scale: 3.2, opacity: 0.16 },
  /** The team's sparks: count/orbit feed `constellationLayout`; a whisper of drift only. */
  SPARKS: { count: 8, orbit: 210, scale: 12, opacity: 0.75, drift: 0.006 },
} as const;

/**
 * The process "Waypoints" (P8.E-2): the landing process world's indigo gas planet with 4 small
 * moons — one per phase (discovery/design/build/launch) — orbiting continuously.
 */
export const WAYPOINTS = {
  PLANET: { radius: 100, x: 0, y: -10, z: -55, tilt: 0.18 },
  HALO: { scale: 3, opacity: 0.15 },
  MOON: { count: 4, radius: 11, orbit: 190, squash: 0.32, spin: 0.05 },
} as const;

/**
 * The blog "Logbook" (P8.E-3): one steady, unringed amber ROCKY planet — a warm, calm reading
 * world — ringed by a slow drift of small sparks standing in for the log's entries (WEB9). Like
 * the About "Hearth" it is deliberately still (reading, not a journey), differentiated by the
 * rocky amber surface + a wider, slowly-drifting entry ring. Amber palette single-sourced off
 * `landingWorlds.blog` (U3/U6); calm mode stills it entirely (WEB4).
 */
export const LOGBOOK = {
  CORE: { radius: 88, x: 0, y: -8, z: -60, tilt: 0.2 },
  HALO: { scale: 3.1, opacity: 0.15 },
  /** The log's entries: count/orbit feed `constellationLayout`; a slow one-way drift only. */
  SPARKS: { count: 7, orbit: 230, scale: 13, opacity: 0.7, drift: 0.008 },
} as const;

/**
 * The request "Launchpad" (P8.E-5): NOT a place you idle — a place you lift off from. A rocky
 * launch-world held low in the frame, a hot ignition core with staged liftoff rings, and an ember
 * column rising past the camera — the ONE signature (WEB9) of the flagship "Start a project"
 * surface. Warm rose/coral single-sourced off `universeSystems.request` (U3/U6); calm mode parks
 * the ascent + rings (WEB4).
 */
export const LAUNCHPAD = {
  /** The launch-world: a rocky planet held low-centre — the ground you lift off from. */
  WORLD: { radius: 94, x: 0, y: -104, z: -58, tilt: 0.16 },
  HALO: { scale: 3, opacity: 0.16 },
  /** The hot ignition source at the launch point. */
  CORE: { x: 0, y: -62, z: -46, scale: 40 },
  /** Two staged liftoff rings pulsing at the launch point (the countdown/liftoff signature). */
  RING: { count: 2, base: 30, tilt: -0.95, y: -70 },
  /** The ember column: embers rising past the camera (looping ascent; parked in calm mode). */
  TRAIL: {
    count: 6,
    baseY: -66,
    riseY: 200,
    spread: 30,
    scale: 15,
    stretch: 1.9,
    opacity: 0.85,
    speed: 0.2,
  },
  /** The far destination star — where the launch is headed. */
  FAR_STAR: { x: 300, y: 150, z: -230, scale: 58, opacity: 0.2 },
} as const;
