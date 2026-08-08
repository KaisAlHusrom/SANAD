/** One world's slot on the services constellation ring. */
export interface ConstellationSlot {
  x: number;
  y: number;
  z: number;
  angle: number;
}

/** Golden-angle-ish vertical stagger factor (× radius) — a constellation, not a flat disc. */
const STAGGER = 0.12;
/** Depth squash: the ring is an ellipse receding into the scene, not a wall. */
const DEPTH = 0.45;

/**
 * Place the service worlds evenly on an elliptical ring around the anchor star (P8.D —
 * the services "Constellation" system). Pure and deterministic; the scene rotates the whole
 * group with time + scroll.
 */
export function constellationLayout(
  count: number,
  radius: number,
): ConstellationSlot[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2;
    return {
      x: Math.cos(angle) * radius,
      y: Math.sin(i * 2.399963) * radius * STAGGER,
      z: Math.sin(angle) * radius * DEPTH,
      angle,
    };
  });
}
