/** Route path segments that anchor each star system (matched after the locale strip, U18). */
export const SYSTEM_ROUTE_SEGMENTS = {
  services: 'services',
  portfolio: 'portfolio',
  contact: 'contact',
  about: 'about',
  process: 'process',
  blog: 'blog',
  faq: 'faq',
  careers: 'careers',
  request: 'request-a-project',
} as const;

/** Flight-director timing invariants (per-plan choreography lives in `plans/flight-plans.ts`). */
export const FLIGHT = {
  /** Failsafe ceiling for an inter-system cruise — arrive even if the route never readies. */
  MAX_ROUTE_HOLD: 4000,
  /** Intra-system hops fail over faster (no warp tunnel to hide in). */
  MAX_ROUTE_HOLD_INTRA: 1500,
  /** Fast-forward time scale while `skipping`. */
  SKIP_SPEED: 2.5,
  /** Per-tick dt ceiling (ms) — a tab-suspend gap must not teleport a flight. */
  MAX_TICK_DT: 100,
  /** Recovery flights (back/forward — the DOM already swapped) get a token cruise. */
  RECOVERY_CRUISE: 250,
  /** Reduced-motion flights collapse to a brief opacity-only veil (WEB4). */
  REDUCED: { departure: 150, cruiseMin: 200, arrival: 250 },
  /** Share of the from→to palette crossfade spent in the departure phase. */
  PALETTE_DEPART_SHARE: 0.35,
  /** Intra hops (no cruise) finish their palette fade inside this first slice of arrival. */
  PALETTE_ARRIVAL_WINDOW: 0.6,
  /** Deep-void darkening peak for `mid-dip` palette curves (0..1). */
  VOID_DIP: 0.5,
  /** Cruise blends its warp from the departure peak over this leading slice of cruise t. */
  CRUISE_WARP_BLEND: 0.2,
} as const;

/**
 * The comet flight path geometry (world units / radians / units-per-second) — genuine WebGL
 * runtime values (the U6 carve-out), colocated per U18.
 */
export const FLIGHT_PATH = {
  /** How far the departure dives below the start pose before the tunnel. */
  DIVE: 260,
  /** Corridor drift speed through the cruise (world units / second). */
  CRUISE_SPEED: 900,
  /** Lateral sway amplitude in the corridor (scaled by the plan's `path.lateral`). */
  SWAY_AMP: 40,
  /** Sway frequency (radians / second). */
  SWAY_FREQ: 0.8,
  /** Max bank roll (radians) at full |departBank|/|arriveBank|. */
  ROLL_MAX: 0.22,
} as const;

/** The traveler comet's sprite geometry (world units — WebGL runtime values, U18). */
export const COMET = {
  /** How far ahead (below, −Y) of the camera the comet leads. */
  LEAD_Y: 170,
  /** Comet plane between the camera (z 420) and the worlds (z 0). */
  Z: 140,
  CORE_SCALE: 30,
  TAIL_WIDTH: 9,
  TAIL_BASE: 120,
  /** Extra tail length at full warp. */
  TAIL_WARP: 260,
  /** Cruise opacity ceiling. */
  GLOW: 0.85,
} as const;
