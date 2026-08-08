/** One expanding signal ring of the contact beacon. */
export interface PulseRing {
  scale: number;
  opacity: number;
}

const PERIOD_SEC = 3.2;
const RING_STAGGER = 1 / 3;
const MAX_SCALE = 8;
const PEAK_OPACITY = 0.5;

/**
 * The contact relay's signal (P8.D "Beacon" system): rings expand outward and fade on a
 * seamless loop, staggered by index so the signal reads continuous — a quiet transmission,
 * not a blink. Pure; the scene applies scale/opacity to additive ring meshes.
 */
export function beaconPulse(
  elapsedSec: number,
  index: number,
  period = PERIOD_SEC,
): PulseRing {
  const local = (elapsedSec / period + index * RING_STAGGER) % 1;
  return {
    scale: 1 + local * MAX_SCALE,
    opacity: (1 - local) * (1 - local) * PEAK_OPACITY,
  };
}
