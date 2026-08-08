/**
 * Pure geometry for the WEB10 orbiting-works spine. Each card sits at a base angle
 * `index / count × 360°` on a ring around the central anchor; the whole ring rotates as the
 * pinned section is scrubbed by scroll (`progress` 0→1). RTL flips the rotation sign via the
 * `dir` scalar (`+1` ltr, `-1` rtl, WEB6). The card nearest the viewer (front of the ring) is
 * the largest/most opaque; the one behind recedes — depth from `sin` of the live angle. Only
 * `x`/`y`/`scale`/`opacity`/`z` come out → the caller animates transform/opacity only (60fps).
 */

export interface OrbitTransform {
  x: number;
  y: number;
  scale: number;
  opacity: number;
  zIndex: number;
}

const TWO_PI = Math.PI * 2;

export function orbitTransform(
  index: number,
  count: number,
  progress: number,
  radius: number,
  dir: 1 | -1 = 1,
): OrbitTransform {
  const base = count > 0 ? (index / count) * TWO_PI : 0;
  // one full turn across the pinned scroll, sign flipped under RTL
  const angle = base + dir * progress * TWO_PI;
  // ring laid in the X/Y plane: front of the ring (sin≈1) is closest to the viewer
  const depth = Math.sin(angle); // -1 (back) … 1 (front)
  const x = Math.cos(angle) * radius;
  const y = -depth * radius * 0.34; // shallow vertical tilt so the ring reads as a spine
  const front = (depth + 1) / 2; // 0 (back) … 1 (front)
  return {
    x,
    y,
    scale: 0.72 + front * 0.34,
    opacity: 0.25 + front * 0.75,
    zIndex: Math.round(front * 100),
  };
}

/**
 * The WEB10 works-orbit geometry (`worksTurnProgress`/`worksFrontIndex`/`worksOrbitTransform`)
 * now lives in `@sanad/web-ui` (single source, U3) — the shared `WorksSection`/`WorksFigure` and
 * the injected `WorksOrbit` client wrapper drive from the same math. Re-exported here so the
 * website's existing motion specs + importers keep resolving `./orbit`.
 */
export {
  worksTurnProgress,
  worksFrontIndex,
  worksOrbitTransform,
  type WorksOrbitTransform,
} from '@sanad/web-ui';
