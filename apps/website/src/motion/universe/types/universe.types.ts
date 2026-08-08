import type { UniverseSystemKey } from '@sanad/config';

/** The star systems the universe knows — one per public route family (P8.D one-universe). */
export type SystemId = UniverseSystemKey;

/** A pathname resolved to its star system (plus the service slug for a detail close-orbit). */
export interface ResolvedSystem {
  system: SystemId;
  /** The decoded service slug when the route is a `serviceDetail` orbit; null otherwise. */
  slug: string | null;
}

/** The flight phases: a travel is departure → cruise → arrival, then back to idle. */
export type FlightPhase = 'idle' | 'departure' | 'cruise' | 'arrival';

/** How the outgoing page's DOM content leaves during departure. */
export type ContentExit = 'streak-up' | 'fade' | 'recede';

/** How the incoming page's DOM content arrives during arrival. */
export type ContentEnter = 'rise' | 'fade' | 'bloom';

/** The arrival deceleration character. */
export type ArrivalDecel = 'glide' | 'overshoot' | 'drop';

/** How the from→to space tint crossfades over the cruise. */
export type PaletteCurve = 'linear' | 'mid-dip';

/** The comet's flight-path shaping — signed values flip with `dir` under RTL (WEB6). */
export interface CometPathSpec {
  /** Bank strength leaving the system (positive = toward inline-end). */
  departBank: number;
  /** Bank strength settling into the destination. */
  arriveBank: number;
  /** Lateral slide amplitude (0..1) — high for an orbit-transfer between sibling planets. */
  lateral: number;
}

/**
 * One directional route-pair's travel choreography (P8.D). All durations in ms; the tuned
 * numbers live in `plans/flight-plans.ts` (U18) keyed `'from>to'` with `'*'` wildcards.
 */
export interface FlightPlan {
  id: string;
  kind: 'inter' | 'intra' | 'return' | 'recovery';
  departure: {
    duration: number;
    /** Peak warp reached as the comet ignites (0..1). */
    warpPeak: number;
    /** Multiplier on the bloom strength at the ignition peak. */
    bloomSurge: number;
    /** Extra FOV degrees at the peak. */
    fovKick: number;
    /** Coin/comet tail flare intensity (0..1). */
    ignition: number;
    contentExit: ContentExit;
  };
  cruise: {
    /** The arrival gate's lower bound — 0 for an intra-system hop (no warp tunnel). */
    minDuration: number;
    /** Failsafe: arrive even if the route never signals ready (an error page still lands). */
    maxHold: number;
    /** Sustained warp through the tunnel (0..1). */
    warp: number;
    /** Warp-streak density/opacity factor (0..1). */
    streakDensity: number;
    paletteCurve: PaletteCurve;
  };
  arrival: {
    duration: number;
    decel: ArrivalDecel;
    contentEnter: ContentEnter;
  };
  path: CometPathSpec;
}

/** The flight director's live state — ref-backed, read per frame, never React state. */
export interface FlightState {
  phase: FlightPhase;
  /** 0→1 within the current phase (0 when idle; cruise clamps against `minDuration`). */
  t: number;
  /** ms elapsed within the current phase. */
  phaseElapsed: number;
  from: SystemId | null;
  to: SystemId | null;
  toSlug: string | null;
  plan: FlightPlan | null;
  /** Href to `router.push` exactly once at the departure→cruise boundary. */
  pendingHref: string | null;
  /** Set by the destination page's `SystemReady` marker once its content is mounted. */
  routeReady: boolean;
  /** Fast-forward requested (Escape / click during flight). */
  skipping: boolean;
  reducedMotion: boolean;
  /** The system the universe is idling in (updated when an arrival completes). */
  currentSystem: SystemId;
  currentSlug: string | null;
}
