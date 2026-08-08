import { CAMERA } from '../../cosmos/constants';
import { cameraY, lookAtTarget } from '../../cosmos/math';
import type { SystemId } from '../types';

/** A complete camera pose along a flight (position + look-at + bank roll). */
export interface FlightPose {
  x: number;
  y: number;
  z: number;
  lookX: number;
  lookY: number;
  lookZ: number;
  roll: number;
}

/**
 * The pose a system idles its camera at — where an arrival MUST end so the handoff to the
 * system's own per-frame camera (landing's scroll flight at progress 0, the idle scenes'
 * parallax rest) is seamless. The landing pose derives from the same `cameraY`/`lookAtTarget`
 * math its scene runs (U3 — never a second copy of the numbers).
 */
export function systemRestPose(system: SystemId): FlightPose {
  const y = system === 'landing' ? cameraY(0) : 0;
  const look = lookAtTarget(0, y);
  return {
    x: 0,
    y,
    z: CAMERA.z,
    lookX: look.x,
    lookY: look.y,
    lookZ: look.z,
    roll: 0,
  };
}
