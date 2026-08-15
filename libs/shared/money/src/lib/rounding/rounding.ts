import type { RoundingMode } from '../rounding.types.js';

/** Half-up is what the region's invoices print, so it is the default everywhere (U9). */
export const DEFAULT_ROUNDING: RoundingMode = 'half-up';

/**
 * Round a minor-unit value to a whole minor unit under an EXPLICIT mode. JS `Math.round` is
 * half-up toward +∞ (`Math.round(-2.5) === -2`), which makes a refund round differently from the
 * charge it reverses — so every mode here is symmetric about zero and spelled out.
 */
export function roundTo(value: number, mode: RoundingMode): number {
  if (Number.isInteger(value)) {
    return value;
  }
  const sign = value < 0 ? -1 : 1;
  const magnitude = Math.abs(value);
  switch (mode) {
    case 'down':
      return sign * Math.floor(magnitude);
    case 'up':
      return sign * Math.ceil(magnitude);
    case 'half-even': {
      const floor = Math.floor(magnitude);
      const fraction = magnitude - floor;
      if (fraction !== 0.5) {
        return sign * Math.round(magnitude);
      }
      return sign * (floor % 2 === 0 ? floor : floor + 1);
    }
    case 'half-up':
      return sign * Math.round(magnitude);
  }
}
