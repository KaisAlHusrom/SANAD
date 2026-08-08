import { hash01 } from '../../cosmos/math';

/** The close-orbit state of a service's own planet (P8.D serviceDetail system). */
export interface DetailOrbitState {
  planetSpin: number;
  ringTilt: number;
  moonCount: 1 | 2;
  moonAngles: number[];
}

/** Hash a slug to a stable 0..1 seed — every service gets its OWN planet character. */
export function detailSeed(slug: string): number {
  let acc = 0;
  for (let i = 0; i < slug.length; i += 1) {
    acc = (acc * 31 + slug.charCodeAt(i)) % 100_000;
  }
  return hash01(acc + 1);
}

const SPIN_RATE = 0.05;
const SCROLL_SPIN = 0.8;
const MOON_RATES = [0.25, 0.17] as const;
const TILT_MIN = 0.3;
const TILT_SPAN = 0.55;

/**
 * The per-frame orbital state: the planet turns with time AND scroll (the page descent IS
 * an orbital advance), the ring tilt + moon count/phases are seeded from the slug so two
 * services never present the same world. Pure/deterministic for a given (time, progress,
 * seed).
 */
export function detailOrbit(
  elapsedSec: number,
  progress: number,
  seed: number,
): DetailOrbitState {
  const moonCount: 1 | 2 = seed > 0.5 ? 2 : 1;
  return {
    planetSpin:
      seed * Math.PI * 2 + elapsedSec * SPIN_RATE + progress * SCROLL_SPIN,
    ringTilt: TILT_MIN + hash01(seed * 97 + 3) * TILT_SPAN,
    moonCount,
    moonAngles: MOON_RATES.slice(0, moonCount).map(
      (rate, i) => seed * Math.PI * 2 * (i + 1) + elapsedSec * rate,
    ),
  };
}
