import { lookAtTarget } from '../../cosmos/math';
import { smoothstep } from '../../cosmos/math';
import { FLIGHT_PATH } from '../constants';
import type { ArrivalDecel, FlightPlan } from '../types';
import type { FlightPose } from './system-rest-pose';

/** Standard back-out overshoot (passes the target ~10% then settles). */
function backOut(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const u = t - 1;
  return 1 + c3 * u * u * u + c1 * u * u;
}

function easeOutCubic(t: number): number {
  const u = 1 - t;
  return 1 - u * u * u;
}

function decelK(decel: ArrivalDecel, t: number): number {
  if (decel === 'overshoot') return backOut(t);
  if (decel === 'drop') return smoothstep(0, 1, t);
  return easeOutCubic(t);
}

function lerpPose(a: FlightPose, b: FlightPose, k: number): FlightPose {
  return {
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    z: a.z + (b.z - a.z) * k,
    lookX: a.lookX + (b.lookX - a.lookX) * k,
    lookY: a.lookY + (b.lookY - a.lookY) * k,
    lookZ: a.lookZ + (b.lookZ - a.lookZ) * k,
    roll: a.roll + (b.roll - a.roll) * k,
  };
}

/** Where a departure resolves: centered over the corridor, DIVE units below the start. */
function corridorAnchor(start: FlightPose): FlightPose {
  const y = start.y - FLIGHT_PATH.DIVE;
  const look = lookAtTarget(0, y);
  return {
    x: 0,
    y,
    z: start.z,
    lookX: look.x,
    lookY: look.y,
    lookZ: look.z,
    roll: 0,
  };
}

/**
 * The departure leg (P8.D): from the EXACT captured camera pose, accelerate down into the
 * corridor with a sin bank flourish that resolves level by the tunnel. `dir` mirrors the
 * bank under RTL (WEB6); each phase starts where the camera actually is, so the path is
 * continuous by construction.
 */
export function departurePose(
  t: number,
  start: FlightPose,
  plan: FlightPlan,
  dir: 1 | -1,
): FlightPose {
  const k = smoothstep(0, 1, t);
  const pose = lerpPose(start, corridorAnchor(start), k);
  pose.roll +=
    Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)) *
    plan.path.departBank *
    FLIGHT_PATH.ROLL_MAX *
    dir;
  return pose;
}

/** The corridor drift: steady descent + a gentle plan-scaled lateral sway. */
export function cruisePose(
  elapsedMs: number,
  entry: FlightPose,
  plan: FlightPlan,
  dir: 1 | -1,
): FlightPose {
  const seconds = elapsedMs / 1000;
  const sway =
    Math.sin(seconds * FLIGHT_PATH.SWAY_FREQ * Math.PI) *
    plan.path.lateral *
    FLIGHT_PATH.SWAY_AMP *
    dir;
  const y = entry.y - FLIGHT_PATH.CRUISE_SPEED * seconds;
  const look = lookAtTarget(0, y);
  return {
    x: entry.x + sway,
    y,
    z: entry.z,
    lookX: look.x + sway * 0.4,
    lookY: look.y,
    lookZ: look.z,
    roll: sway * 0.002,
  };
}

/**
 * The arrival leg: from the tunnel-exit pose to the destination's rest pose with the plan's
 * deceleration character — `glide` eases out, `overshoot` passes home and settles back,
 * `drop` falls in symmetric — plus an arrive-bank flourish that resolves level at rest.
 */
export function arrivalPose(
  t: number,
  entry: FlightPose,
  rest: FlightPose,
  plan: FlightPlan,
  dir: 1 | -1,
): FlightPose {
  const k = decelK(plan.arrival.decel, Math.min(Math.max(t, 0), 1));
  const pose = lerpPose(entry, rest, k);
  pose.roll +=
    Math.sin(Math.PI * Math.min(Math.max(t, 0), 1)) *
    plan.path.arriveBank *
    FLIGHT_PATH.ROLL_MAX *
    dir;
  return pose;
}
