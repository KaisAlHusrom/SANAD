import { FLIGHT } from '../constants';
import type { FlightPlan } from '../types';

/**
 * The named flight choreographies (P8.D), keyed `'from>to'` over system ids with `'*'`
 * wildcards; resolution precedence is exact → `from>*` → `*>to` → `*>*`
 * (`math/resolve-flight-plan.ts`). Directions are deliberately DISTINCT — an outbound
 * survey is not a return flight — and intra-system hops skip the warp tunnel entirely
 * (`cruise.minDuration: 0`). All tuned numbers live here, never inline in a scene (U18).
 * Signed `path` values are authored for LTR and flipped by `dir` under RTL (WEB6).
 */
export const FLIGHT_PLANS: Readonly<Record<string, FlightPlan>> = {
  /** Outbound survey — the full ceremony: ignition, warp tunnel, glide into the constellation. */
  'landing>services': {
    id: 'landing>services',
    kind: 'inter',
    departure: {
      duration: 650,
      warpPeak: 1,
      bloomSurge: 1.35,
      fovKick: 9,
      ignition: 1,
      contentExit: 'streak-up',
    },
    cruise: {
      minDuration: 900,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 1,
      streakDensity: 1,
      paletteCurve: 'mid-dip',
    },
    arrival: { duration: 650, decel: 'glide', contentEnter: 'rise' },
    path: { departBank: 1, arriveBank: -0.4, lateral: 0.2 },
  },

  /** Return flight — banks the opposite side and overshoot-settles into the home star. */
  'services>landing': {
    id: 'services>landing',
    kind: 'return',
    departure: {
      duration: 450,
      warpPeak: 0.9,
      bloomSurge: 1.2,
      fovKick: 7,
      ignition: 0.8,
      contentExit: 'recede',
    },
    cruise: {
      minDuration: 650,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 0.9,
      streakDensity: 0.8,
      paletteCurve: 'linear',
    },
    arrival: { duration: 700, decel: 'overshoot', contentEnter: 'bloom' },
    path: { departBank: -1, arriveBank: 0.5, lateral: 0.2 },
  },

  /** Intra-system hop — no tunnel; the camera swings from the constellation into one planet. */
  'services>serviceDetail': {
    id: 'services>serviceDetail',
    kind: 'intra',
    departure: {
      duration: 300,
      warpPeak: 0.35,
      bloomSurge: 1.1,
      fovKick: 4,
      ignition: 0.3,
      contentExit: 'fade',
    },
    cruise: {
      minDuration: 0,
      maxHold: FLIGHT.MAX_ROUTE_HOLD_INTRA,
      warp: 0.35,
      streakDensity: 0.3,
      paletteCurve: 'linear',
    },
    arrival: { duration: 550, decel: 'glide', contentEnter: 'rise' },
    path: { departBank: 0.5, arriveBank: -0.3, lateral: 0.5 },
  },

  /** Orbit release — pull back out of the close orbit, drop to the constellation overview. */
  'serviceDetail>services': {
    id: 'serviceDetail>services',
    kind: 'intra',
    departure: {
      duration: 250,
      warpPeak: 0.3,
      bloomSurge: 1.05,
      fovKick: 3,
      ignition: 0.25,
      contentExit: 'fade',
    },
    cruise: {
      minDuration: 0,
      maxHold: FLIGHT.MAX_ROUTE_HOLD_INTRA,
      warp: 0.3,
      streakDensity: 0.3,
      paletteCurve: 'linear',
    },
    arrival: { duration: 450, decel: 'drop', contentEnter: 'fade' },
    path: { departBank: -0.4, arriveBank: 0.3, lateral: 0.4 },
  },

  /** Orbit transfer — a lateral slide between two sibling service planets. */
  'serviceDetail>serviceDetail': {
    id: 'serviceDetail>serviceDetail',
    kind: 'intra',
    departure: {
      duration: 250,
      warpPeak: 0.25,
      bloomSurge: 1.05,
      fovKick: 3,
      ignition: 0.2,
      contentExit: 'fade',
    },
    cruise: {
      minDuration: 150,
      maxHold: FLIGHT.MAX_ROUTE_HOLD_INTRA,
      warp: 0.25,
      streakDensity: 0.25,
      paletteCurve: 'linear',
    },
    arrival: { duration: 450, decel: 'glide', contentEnter: 'fade' },
    path: { departBank: 0, arriveBank: 0, lateral: 1 },
  },

  /** Beacon run — a calm approach: modest warp, sparse streaks, a slow glide to the relay. */
  'landing>contact': {
    id: 'landing>contact',
    kind: 'inter',
    departure: {
      duration: 500,
      warpPeak: 0.7,
      bloomSurge: 1.15,
      fovKick: 6,
      ignition: 0.6,
      contentExit: 'fade',
    },
    cruise: {
      minDuration: 700,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 0.7,
      streakDensity: 0.4,
      paletteCurve: 'linear',
    },
    arrival: { duration: 700, decel: 'glide', contentEnter: 'fade' },
    path: { departBank: 0.6, arriveBank: -0.3, lateral: 0.15 },
  },

  /** Hearth run — a calm homecoming glide, mirroring the beacon run (About is trust, not a survey). */
  'landing>about': {
    id: 'landing>about',
    kind: 'inter',
    departure: {
      duration: 500,
      warpPeak: 0.7,
      bloomSurge: 1.15,
      fovKick: 6,
      ignition: 0.6,
      contentExit: 'fade',
    },
    cruise: {
      minDuration: 700,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 0.7,
      streakDensity: 0.4,
      paletteCurve: 'linear',
    },
    arrival: { duration: 700, decel: 'glide', contentEnter: 'fade' },
    path: { departBank: 0.5, arriveBank: -0.25, lateral: 0.15 },
  },

  /** Waypoints run — a steady, moderate glide into the phased-delivery moons. */
  'landing>process': {
    id: 'landing>process',
    kind: 'inter',
    departure: {
      duration: 550,
      warpPeak: 0.8,
      bloomSurge: 1.2,
      fovKick: 7,
      ignition: 0.7,
      contentExit: 'streak-up',
    },
    cruise: {
      minDuration: 800,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 0.8,
      streakDensity: 0.6,
      paletteCurve: 'linear',
    },
    arrival: { duration: 650, decel: 'glide', contentEnter: 'rise' },
    path: { departBank: 0.7, arriveBank: -0.35, lateral: 0.2 },
  },

  /** Logbook run — a calm reading glide into the amber blog world (mirrors the Hearth run). */
  'landing>blog': {
    id: 'landing>blog',
    kind: 'inter',
    departure: {
      duration: 500,
      warpPeak: 0.7,
      bloomSurge: 1.15,
      fovKick: 6,
      ignition: 0.6,
      contentExit: 'fade',
    },
    cruise: {
      minDuration: 700,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 0.7,
      streakDensity: 0.4,
      paletteCurve: 'linear',
    },
    arrival: { duration: 700, decel: 'glide', contentEnter: 'fade' },
    path: { departBank: 0.5, arriveBank: -0.25, lateral: 0.15 },
  },

  /** Page turn inside the logbook — index↔post, a lateral slide, no warp tunnel. */
  'blog>blog': {
    id: 'blog>blog',
    kind: 'intra',
    departure: {
      duration: 280,
      warpPeak: 0.28,
      bloomSurge: 1.05,
      fovKick: 3,
      ignition: 0.25,
      contentExit: 'fade',
    },
    cruise: {
      minDuration: 150,
      maxHold: FLIGHT.MAX_ROUTE_HOLD_INTRA,
      warp: 0.28,
      streakDensity: 0.25,
      paletteCurve: 'linear',
    },
    arrival: { duration: 480, decel: 'glide', contentEnter: 'fade' },
    path: { departBank: 0, arriveBank: 0, lateral: 1 },
  },

  /** Outbound survey to the works galaxy — a grand glide into the big violet ringed world. */
  'landing>works': {
    id: 'landing>works',
    kind: 'inter',
    departure: {
      duration: 650,
      warpPeak: 1,
      bloomSurge: 1.4,
      fovKick: 10,
      ignition: 1,
      contentExit: 'streak-up',
    },
    cruise: {
      minDuration: 950,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 1,
      streakDensity: 1,
      paletteCurve: 'mid-dip',
    },
    arrival: { duration: 700, decel: 'glide', contentEnter: 'rise' },
    path: { departBank: 1, arriveBank: -0.5, lateral: 0.25 },
  },

  /** Orbit transfer inside the galaxy — index↔case-study, a lateral slide, no warp tunnel. */
  'works>works': {
    id: 'works>works',
    kind: 'intra',
    departure: {
      duration: 280,
      warpPeak: 0.28,
      bloomSurge: 1.05,
      fovKick: 3,
      ignition: 0.25,
      contentExit: 'fade',
    },
    cruise: {
      minDuration: 150,
      maxHold: FLIGHT.MAX_ROUTE_HOLD_INTRA,
      warp: 0.28,
      streakDensity: 0.25,
      paletteCurve: 'linear',
    },
    arrival: { duration: 480, decel: 'glide', contentEnter: 'fade' },
    path: { departBank: 0, arriveBank: 0, lateral: 1 },
  },

  /** Ignition run — the flagship "Start a project" outbound: full ceremony, a strong bloom surge,
   *  streaks climbing as the launch-world ascends past the camera into the launchpad. */
  'landing>request': {
    id: 'landing>request',
    kind: 'inter',
    departure: {
      duration: 650,
      warpPeak: 1,
      bloomSurge: 1.4,
      fovKick: 10,
      ignition: 1,
      contentExit: 'streak-up',
    },
    cruise: {
      minDuration: 900,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 1,
      streakDensity: 1,
      paletteCurve: 'mid-dip',
    },
    arrival: { duration: 700, decel: 'glide', contentEnter: 'rise' },
    path: { departBank: 1, arriveBank: -0.5, lateral: 0.25 },
  },

  /** Launch from anywhere — every page's "Start a project" CTA flies here, so give the arrival a
   *  consistent ignition feel regardless of origin (a shade calmer than the landing ceremony). */
  '*>request': {
    id: '*>request',
    kind: 'inter',
    departure: {
      duration: 550,
      warpPeak: 0.95,
      bloomSurge: 1.3,
      fovKick: 9,
      ignition: 0.85,
      contentExit: 'streak-up',
    },
    cruise: {
      minDuration: 750,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 0.95,
      streakDensity: 0.85,
      paletteCurve: 'mid-dip',
    },
    arrival: { duration: 650, decel: 'glide', contentEnter: 'rise' },
    path: { departBank: 0.8, arriveBank: -0.4, lateral: 0.22 },
  },

  /** Any return home — the overshoot settle into the hero star. */
  '*>landing': {
    id: '*>landing',
    kind: 'return',
    departure: {
      duration: 450,
      warpPeak: 0.9,
      bloomSurge: 1.2,
      fovKick: 7,
      ignition: 0.8,
      contentExit: 'recede',
    },
    cruise: {
      minDuration: 650,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 0.9,
      streakDensity: 0.8,
      paletteCurve: 'linear',
    },
    arrival: { duration: 650, decel: 'overshoot', contentEnter: 'bloom' },
    path: { departBank: -0.8, arriveBank: 0.5, lateral: 0.2 },
  },

  /** The default inter-system warp for every unlisted pair. */
  '*>*': {
    id: '*>*',
    kind: 'inter',
    departure: {
      duration: 500,
      warpPeak: 0.9,
      bloomSurge: 1.2,
      fovKick: 7,
      ignition: 0.7,
      contentExit: 'fade',
    },
    cruise: {
      minDuration: 700,
      maxHold: FLIGHT.MAX_ROUTE_HOLD,
      warp: 0.9,
      streakDensity: 0.7,
      paletteCurve: 'linear',
    },
    arrival: { duration: 600, decel: 'glide', contentEnter: 'rise' },
    path: { departBank: 0.7, arriveBank: -0.4, lateral: 0.2 },
  },
};
