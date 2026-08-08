/**
 * Pure geometry for the WEB10 orbiting-works spine — the case-study cards circling the cosmos coin
 * turned vertical spine. Moved into `@sanad/web-ui` (single source, U3) so the shared `WorksFigure`
 * and the website's injected client `Orbit` wrapper drive from the SAME math (`type:ui`-safe — no
 * THREE / no client imports). Cards ride a circle in the X/Z plane; the front card (`depth`→1) is
 * largest, sharpest, opaque and clickable, the back ones shrink/blur/recede. The whole ring turns
 * one full rotation as the pinned works chapter is scrubbed (`local` 0→1), sign-flipped under RTL
 * (`dir`). `vis` fades the cards in as the planet docks and out as the chapter releases.
 * Transform/opacity/blur only (60fps).
 */

const TWO_PI = Math.PI * 2;

/** Clamped Hermite smoothstep (0 below `edge0`, 1 above `edge1`) — the fade/turn easing. */
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/** One card's live position on the ring — only transform/opacity/blur/z come out (60fps). */
export interface WorksOrbitTransform {
  x: number;
  z: number;
  depth: number;
  scale: number;
  opacity: number;
  blur: number;
  zIndex: number;
  pointerEvents: 'auto' | 'none';
}

/**
 * The ring's turn progress (0→1) from the chapter's local scroll. The ring is **held static while
 * the cards arrive** (they fade in over local 0.26→0.48 with the FIRST card at the front), then
 * makes its full rotation across 0.45→0.95 — so the first case study is readable once the section
 * is fully visible instead of already sliding away (owner fix 2026-07-07 #4).
 */
export function worksTurnProgress(local: number): number {
  return Math.min(1, Math.max(0, (local - 0.45) / (0.95 - 0.45)));
}

/**
 * The index of the card the works ring currently holds at the FRONT (max depth) — drives the
 * mono `NN / NN` orbit counter. Inverts the `worksOrbitTransform` angle: depth peaks where
 * `i·(2π/n) + dir·turn·2π ≡ 0 (mod 2π)` — card 0 front at the hold. RTL flips via `dir` (WEB6).
 */
export function worksFrontIndex(
  local: number,
  count: number,
  dir: 1 | -1 = 1,
): number {
  if (count <= 0) return 0;
  const raw = Math.round(-dir * worksTurnProgress(local) * count);
  return ((raw % count) + count) % count;
}

export function worksOrbitTransform(
  index: number,
  count: number,
  local: number,
  radius: number,
  dir: 1 | -1 = 1,
): WorksOrbitTransform {
  const n = count > 0 ? count : 1;
  // no phase offset: index 0 sits at the front (cos = 1) while the ring is held
  const angle = index * (TWO_PI / n) + dir * worksTurnProgress(local) * TWO_PI;
  const x = Math.sin(angle) * radius;
  const z = Math.cos(angle);
  const depth = (z + 1) / 2; // 0 (back) … 1 (front)
  // cards appear as the planet docks and leave WITH it (planet exit window is 0.84→1 — #5 sync)
  const vis =
    smoothstep(0.26, 0.48, local) * (1 - smoothstep(0.84, 0.97, local));
  return {
    x,
    z,
    depth,
    scale: 0.62 + 0.46 * depth,
    opacity: (0.04 + 0.96 * Math.pow(depth, 1.5)) * vis,
    blur: (1 - depth) * 6.5,
    zIndex: Math.round(depth * 100),
    pointerEvents: depth > 0.82 ? 'auto' : 'none',
  };
}
