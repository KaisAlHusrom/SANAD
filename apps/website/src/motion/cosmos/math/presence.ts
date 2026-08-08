import { smoothstep } from './smoothstep';
import type { PresenceState } from '../types';

/**
 * A chapter planet's presence across its section's local scroll (0→1), ported from the reference
 * `updateScene`. It **arrives** from below and dollies forward over the first third (rising from
 * Y −560, pushing +150 Z toward the camera as it settles), **docks** through the middle
 * (presence = 1, gentle idle spin), then **exits** — accelerating up (+560 Y) and receding
 * (−320 Z) — over the last stretch. Pure/testable; the scene adds the camera Y, the world offset,
 * an idle bob, and the `0.78 + 0.36·presence` swell.
 */

/** Arrival completes by this local-progress; exit begins here. Reference-locked windows. */
const ARRIVE_END = 0.34;
const EXIT_START = 0.84;
/** Reference travel distances: rises from −560 Y + dollies +150 Z on arrival; exits +560 Y / −320 Z. */
const ARRIVE_Y = -560;
const ARRIVE_Z = 150;
const EXIT_Y = 560;
const EXIT_Z = -320;
/** Idle spin accrued per unit of docked presence (a gentle turn). */
const DOCK_SPIN = 0.9;

export function planetPresence(local: number): PresenceState {
  const arrive = smoothstep(0, ARRIVE_END, local);
  const leave = smoothstep(EXIT_START, 1, local);
  const away = leave * leave; // accelerating exit
  const presence = arrive * (1 - leave);
  return {
    presence,
    opacity: presence,
    // rises from below into place, then lifts up and away on exit
    y: (1 - arrive) * ARRIVE_Y + away * EXIT_Y,
    // dollies forward to dock, then recedes into deep space as it powers away
    z: arrive * ARRIVE_Z + away * EXIT_Z,
    scale: 0.78 + 0.36 * presence,
    rotate: presence * DOCK_SPIN,
  };
}
