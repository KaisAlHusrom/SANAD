import { smoothstep } from './smoothstep';

/**
 * As the footer finale reveals (its `opacity` climbing ~0.5→1), its content rows cascade in one
 * after another — each `[data-foot-item]` starts a little later than the last and rises into place.
 * Pure/testable; the footer sets each item's `opacity`/`translateY` from this.
 */

const FIRST_START = 0.5; // items begin appearing once the footer is half-revealed
const PER_ITEM = 0.06; // each subsequent row waits this much more footer-opacity
const WINDOW = 0.18; // how much opacity-travel each row takes to fully appear
const RISE = 40; // px it rises from

export function footItemReveal(
  index: number,
  footerOpacity: number,
): { opacity: number; translateY: number } {
  const start = FIRST_START + index * PER_ITEM;
  const t = smoothstep(start, start + WINDOW, footerOpacity);
  return { opacity: t, translateY: (1 - t) * RISE };
}
