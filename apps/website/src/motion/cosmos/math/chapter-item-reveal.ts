import { clamp } from './smoothstep';

/**
 * A chapter's content items **arc out of the docked planet**, staggered, revealed only **after the
 * world docks** — the reference `chapterReveal`. `local` is the chapter's own scroll progress (0→1);
 * `cp` gates the reveal so nothing shows before the planet arrives (0.30) and everything is in by
 * 0.84; each item `i` of `count` is staggered, eases in from its angle/distance around the top, and
 * **stays** — except an `exit` chapter (the reference `data-chapter-exit`, only trust) draws its
 * items back up into the world's light as you scroll past. Pure/testable; the chapter writes
 * `transform`/`opacity`/`filter` from this (transform+filter only, 60fps). Fixes the flicker: content
 * is driven by ONE scroll-linked system, never an in-view fade racing a scrubbed transform.
 */

export interface ChapterItemFlow {
  opacity: number;
  tx: number;
  ty: number;
  tz: number;
  rot: number;
  scale: number;
  blur: number;
  /** 0→1 arrival glow for the item's accent drop-shadow (cards only, applied by the caller). */
  glow: number;
}

/** Reference-locked reveal windows. */
const REVEAL_START = 0.3;
const REVEAL_END = 0.84;
const WIN = 0.54;
const STAGGER_SPAN = 0.46;
const EXIT_START = 0.82;
const EXIT_END = 0.985;
const EXIT_SPAN = 0.36;

/** The item's resting angle/distance/roll around the top of the docked world (reference fan-out). */
export function chapterItemAnchor(
  i: number,
  count: number,
): { ang: number; dist: number; rot: number } {
  const n = Math.max(1, count - 1);
  const frac = count > 1 ? i / n : 0.5;
  const ang = -Math.PI / 2 + (frac - 0.5) * Math.PI * 1.15; // fan out around the top
  const side = i % 2 === 0 ? 1 : -1;
  return { ang, dist: 130 + (i % 3) * 34, rot: side * 9 };
}

export function chapterItemReveal(
  i: number,
  count: number,
  local: number,
  exit = false,
): ChapterItemFlow {
  const cp = clamp((local - REVEAL_START) / (REVEAL_END - REVEAL_START), 0, 1);
  const stg = count > 1 ? STAGGER_SPAN / count : 0;
  const { ang, dist, rot } = chapterItemAnchor(i, count);
  const p = clamp((cp - i * stg) / WIN, 0, 1);
  const e = 1 - Math.pow(1 - p, 3); // ease-out cubic arrival
  const away = 1 - e;

  let tx = Math.cos(ang) * away * dist;
  let ty = Math.sin(ang) * away * dist * 0.62 + away * 48;
  let rotv = away * rot;
  let sc = 0.62 + 0.38 * e;
  let tz = -away * 200;
  let op = 0.02 + 0.98 * e;
  let bl = away * 9;
  let glow = e;

  if (exit) {
    const exitGate = clamp(
      (local - EXIT_START) / (EXIT_END - EXIT_START),
      0,
      1,
    );
    const exSpan = count > 1 ? EXIT_SPAN / count : 0;
    // reverse stagger — the last items to arrive are the first drawn back out
    const order = count - 1 - i;
    const xp = clamp((exitGate - order * exSpan) / (1 - EXIT_SPAN), 0, 1);
    const xe = xp * xp * (3 - 2 * xp); // smoothstep accel
    const lift = xe * (250 + (i % 3) * 52);
    tx += Math.cos(ang) * xe * 132;
    ty += -lift + Math.sin(ang) * xe * 36;
    tz += -xe * 580;
    rotv += rot * xe * 2.6;
    sc *= 1 - xe * 0.52;
    op *= 1 - xe;
    bl += xe * 19;
    glow = e * (1 - xe);
  }

  return {
    opacity: op,
    tx,
    ty,
    tz,
    rot: rotv,
    scale: Math.max(0.04, sc),
    blur: bl,
    glow,
  };
}
