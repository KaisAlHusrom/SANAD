/**
 * Pure geometry for the trust chapter's **domain constellation** — the DB-driven project
 * categories rendered as named stars joined by hairline links (an authored asterism, not a
 * generic dot field, WEB9). Positions are hand-tuned constants: deterministic (no randomness —
 * the SVG is server-rendered and must hydrate byte-identical) and 1-decimal so the browser's
 * sub-pixel rounding can't mismatch the SSR markup. The first five stars form an open chain;
 * later stars attach as authored branches so the figure reads as a constellation, never a snake.
 * RTL mirrors the whole SVG via `scaleX(var(--dir))` at the call site (labels re-flipped, WEB6).
 *
 * Lives in `@sanad/web-ui` (single source, U3) so the shared `TrustSection` renders the static
 * figure AND the website's motion wrapper drives the SAME figure — byte-identical DOM. Pure math,
 * no gsap/THREE, so `type:ui`-safe.
 */

export interface ConstellationStar {
  /** viewBox units (0 … CONSTELLATION_VIEW.width), 1 decimal. */
  x: number;
  /** viewBox units (0 … CONSTELLATION_VIEW.height), 1 decimal. */
  y: number;
  /** dot radius in viewBox units — varied so the field reads as depth. */
  r: number;
  /** which side the domain label sits on, chosen away from the nearest edge. */
  labelSide: 'above' | 'below';
}

export interface ConstellationLayout {
  stars: ConstellationStar[];
  links: Array<[number, number]>;
}

export const CONSTELLATION_VIEW = { width: 100, height: 60 } as const;

/** Hand-tuned asterism anchors (x, y in viewBox units) — order = domain order. */
const ANCHORS: ReadonlyArray<readonly [number, number]> = [
  [7, 38],
  [25, 15],
  [46, 33],
  [67, 12],
  [92, 30],
  [35, 51],
  [79, 50],
  [14, 7],
];

/** Branch partners for stars past the 5-star main chain (index → chain star it links to). */
const BRANCHES: Readonly<Record<number, number>> = { 5: 2, 6: 3, 7: 1 };

/** Star dot radii cycle — three depths. */
const RADII: readonly number[] = [1.6, 1.05, 1.3];

const CHAIN_LENGTH = 5;

export function constellationLayout(count: number): ConstellationLayout {
  const n = Math.max(0, Math.min(count, ANCHORS.length));
  const stars: ConstellationStar[] = [];
  for (let i = 0; i < n; i++) {
    const anchor = ANCHORS[i];
    if (!anchor) continue;
    const [x, y] = anchor;
    stars.push({
      x,
      y,
      r: RADII[i % RADII.length] ?? 1.3,
      labelSide: y < 30 ? 'below' : 'above',
    });
  }

  const links: Array<[number, number]> = [];
  const chain = Math.min(n, CHAIN_LENGTH);
  for (let i = 0; i < chain - 1; i++) links.push([i, i + 1]);
  for (let i = CHAIN_LENGTH; i < n; i++) {
    const partner = BRANCHES[i];
    if (partner !== undefined && partner < n) links.push([i, partner]);
  }

  return { stars, links };
}

/**
 * Scroll-linked line-draw progress (0→1) from the trust chapter's local progress: the figure
 * starts tracing as the world docks (the `.lp-flow` reveal gate is local ≈ 0.30) and is complete
 * across the dock plateau. Monotonic — clamped smoothstep.
 */
export function constellationDraw(local: number): number {
  const t = Math.min(1, Math.max(0, (local - 0.34) / (0.68 - 0.34)));
  return t * t * (3 - 2 * t);
}

/**
 * Per-star pop (0→1) staggered along the chain, so each star lights as the tracing line reaches
 * it. `draw` is `constellationDraw`'s output.
 */
export function starReveal(index: number, count: number, draw: number): number {
  if (count <= 0) return 0;
  const start = count > 1 ? (index / count) * 0.7 : 0;
  const t = Math.min(1, Math.max(0, (draw - start) / 0.3));
  return t * t * (3 - 2 * t);
}
