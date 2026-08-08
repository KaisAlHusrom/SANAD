import { clamp, smoothstep } from './smoothstep';

/**
 * The process "phases as moons" system (reference `updateProcessOrbit`). Four moons orbit the docked
 * process planet on an ellipse; the active phase rises to the top and enlarges, and **the matching
 * step card cross-fades in one at a time** as its moon becomes active (not a 4-up grid). All gated by
 * `dock` so the whole system fades in only once the world has arrived and out as it leaves. Pure/
 * testable; the component writes transforms/opacity from these. `local` is the process chapter's
 * scroll progress (0→1).
 */

/** Dock gate — 0 while the world flies in, 1 once docked, back to 0 as we leave. */
export function procDock(local: number): number {
  return smoothstep(0.32, 0.46, local) * (1 - smoothstep(0.84, 1, local));
}

/**
 * Active phase as a float 0..count-1. The sweep starts only AFTER the dock completes (0.46 in
 * `procDock`) so the FIRST briefing is fully readable while the section is fully visible — it used
 * to start mid-dock (0.40) and the user always landed on phase 2 (owner fix 2026-07-07 #4). It
 * completes by 0.84, when the planet begins to leave.
 */
export function procActiveFloat(local: number, count: number): number {
  const p = clamp((local - 0.5) / 0.34, 0, 1);
  return p * Math.max(0, count - 1);
}

export interface ProcMoon {
  x: number;
  y: number;
  scale: number;
  depth: number;
  opacity: number;
  active: boolean;
  z: number;
}

/** One moon's place on the ellipse at the current active-float (reference geometry). */
export function procMoon(
  i: number,
  count: number,
  activeFloat: number,
  rx: number,
  ry: number,
  oy: number,
  dock: number,
): ProcMoon {
  const focus = -Math.PI / 2; // the active moon rises to the top, above the world
  const step = (2 * Math.PI) / count;
  const active = clamp(Math.round(activeFloat), 0, count - 1);
  const ang = focus + (i - activeFloat) * step;
  const x = Math.cos(ang) * rx;
  const y = Math.sin(ang) * ry + oy;
  const depth = (-Math.sin(ang) + 1) / 2; // 1 at front (top, nearest the camera)
  const isAct = i === active;
  const scale = (0.5 + 0.72 * depth) * (isAct ? 1.4 : 1);
  const vis = clamp((activeFloat - (i - 0.7)) / 0.6, 0, 1);
  return {
    x,
    y,
    scale,
    depth,
    opacity: dock * vis * (0.22 + 0.78 * depth),
    active: isAct,
    z: Math.round(depth * 40) + (isAct ? 60 : 0),
  };
}

/** A step card is fully shown when its moon is active, fading as the active phase moves away. */
export function procCardReveal(
  i: number,
  activeFloat: number,
  dock: number,
): { opacity: number; translateY: number } {
  const o = clamp(1 - Math.abs(activeFloat - i) * 1.8, 0, 1);
  return { opacity: dock * o, translateY: (1 - o) * 18 };
}

/** The active phase index (1-based label uses this + 1) for the "٠٢ / ٠٤" step counter. */
export function procActiveIndex(activeFloat: number, count: number): number {
  return clamp(Math.round(activeFloat), 0, count - 1);
}
