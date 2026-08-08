import { describe, expect, it } from 'vitest';
import { warpStreakCount, warpStreak } from './warp-geometry';
import { layerRotation } from './starfield-rotation';
import { moonRingPosition, moonRingVisibility } from './moon-ring';
import { chapterItemReveal, chapterItemAnchor } from './chapter-item-reveal';
import {
  procDock,
  procActiveFloat,
  procMoon,
  procCardReveal,
  procActiveIndex,
} from './process-orbit';
import { gridFan } from './grid-fan';
import { footerReveal } from './footer-reveal';
import { emberDelay, emberSpec, emberTransform } from './ember';
import { footItemReveal } from './foot-item-stagger';
import { worksOrbitTransform } from '../../orbit';

describe('warp geometry', () => {
  it('count scales 70 → 150 with warp', () => {
    expect(warpStreakCount(0)).toBe(70);
    expect(warpStreakCount(1)).toBe(150);
    expect(warpStreakCount(0.5)).toBe(110);
  });

  it('streaks are invisible below threshold, length grows with warp', () => {
    expect(warpStreak(0).opacity).toBe(0);
    expect(warpStreak(0.01).opacity).toBe(0); // below 0.015
    expect(warpStreak(0.5).opacity).toBeGreaterThan(0);
    expect(warpStreak(1).length).toBeGreaterThan(warpStreak(0).length);
    expect(warpStreak(1).opacity).toBeCloseTo(0.5, 5);
  });
});

describe('starfield rotation', () => {
  it('is static under calm', () => {
    expect(layerRotation(10, 1, true)).toBe(0);
    expect(layerRotation(10, 2, true)).toBe(0);
  });

  it('holds the far layer (0) still — only the two nearer layers drift', () => {
    expect(layerRotation(10, 0, false)).toBe(0);
    expect(layerRotation(10, 1, false)).not.toBe(0);
    expect(layerRotation(10, 2, false)).not.toBe(0);
  });

  it('drifts layers 1 and 2 on Y in opposite directions', () => {
    const l1 = layerRotation(10, 1, false);
    const l2 = layerRotation(10, 2, false);
    expect(Math.sign(l1)).toBe(-1);
    expect(Math.sign(l2)).toBe(1);
  });
});

describe('moon ring', () => {
  it('the active moon rides to the top-centre and is largest', () => {
    // activeFloat = 0 → moon 0 is active, at the focus (top-centre)
    const active = moonRingPosition(0, 4, 0, 300);
    expect(active.active).toBe(true);
    expect(active.x).toBeCloseTo(0, 5); // centred
    const other = moonRingPosition(2, 4, 0, 300);
    expect(active.scale).toBeGreaterThan(other.scale);
  });

  it('flips orbit direction under RTL', () => {
    const ltr = moonRingPosition(1, 4, 0, 300, 1);
    const rtl = moonRingPosition(1, 4, 0, 300, -1);
    expect(rtl.x).toBeCloseTo(-ltr.x, 5);
  });

  it('visibility gates around the dock window', () => {
    expect(moonRingVisibility(0)).toBe(0);
    expect(moonRingVisibility(0.6)).toBeCloseTo(1, 5);
    expect(moonRingVisibility(1)).toBe(0);
  });
});

describe('worksOrbitTransform (cards around the spine)', () => {
  it('holds the ring STATIC — first card at the front — until the cards have fully arrived', () => {
    // the ring must not have turned while the section is still revealing, so the first case study
    // is readable once the chapter is fully visible (owner fix 2026-07-07 #4)
    const arriving = worksOrbitTransform(0, 5, 0.3, 400);
    const settled = worksOrbitTransform(0, 5, 0.45, 400);
    expect(arriving.x).toBeCloseTo(settled.x, 5); // no rotation yet
    expect(settled.depth).toBeCloseTo(1, 5); // card 0 is the front card at the hold
    expect(settled.opacity).toBeGreaterThan(0.5); // and it is visible
  });

  it('settles to identity-ish sizes and fans front vs back', () => {
    const front = worksOrbitTransform(0, 5, 0.45, 400);
    // a card two-fifths round is receded
    const back = worksOrbitTransform(2, 5, 0.45, 400);
    expect(front.scale).toBeGreaterThan(back.scale);
    expect(front.depth).toBeGreaterThan(back.depth);
    expect(front.blur).toBeLessThan(back.blur);
  });

  it('turns a full rotation across the pinned scrub after the hold', () => {
    const start = worksOrbitTransform(0, 5, 0.45, 400);
    const mid = worksOrbitTransform(0, 5, 0.7, 400); // half the turn window
    expect(mid.depth).toBeLessThan(start.depth); // card 0 has ridden away from the front
  });

  it('is invisible outside the dock window and spins the opposite way under RTL', () => {
    expect(worksOrbitTransform(0, 5, 0, 400).opacity).toBe(0); // before dock
    // fades out WITH the leaving planet (exit sync, owner fix 2026-07-07 #5)
    expect(worksOrbitTransform(0, 5, 0.97, 400).opacity).toBeCloseTo(0, 2);
    // the ring rotates the other direction under RTL (WEB6): card 0's path mirrors exactly
    const ltr = worksOrbitTransform(0, 5, 0.6, 400, 1);
    const rtl = worksOrbitTransform(0, 5, 0.6, 400, -1);
    expect(rtl.x).toBeCloseTo(-ltr.x, 5);
    expect(Math.abs(ltr.x)).toBeGreaterThan(1); // the turn has actually moved the card
  });
});

describe('chapterItemReveal (content arcs out of the docked planet, staggered, then stays)', () => {
  // The planet docks across [0.34 → 0.84] (presence.ts). Content is gated to reveal ONLY after the
  // world docks (cp starts at local 0.30) and each item arcs in staggered — one scroll-linked system,
  // never an in-view fade racing the transform (the flicker fix).
  it('is hidden before the world docks (no pre-show flicker)', () => {
    const f0 = chapterItemReveal(0, 4, 0.0);
    const fEnter = chapterItemReveal(0, 4, 0.25); // still before cp start (0.30)
    expect(f0.opacity).toBeLessThan(0.1);
    expect(fEnter.opacity).toBeLessThan(0.1);
    expect(f0.blur).toBeGreaterThan(5);
  });

  it('arrives to identity by the dock and STAYS through the plateau (non-exit chapter)', () => {
    const f = chapterItemReveal(0, 4, 0.84);
    expect(f.opacity).toBeGreaterThan(0.95);
    expect(f.scale).toBeCloseTo(1, 1);
    expect(f.blur).toBeCloseTo(0, 1);
    // a non-exit chapter holds settled even at the very end (content doesn't recede/flicker out)
    const end = chapterItemReveal(0, 4, 1.0);
    expect(end.opacity).toBeGreaterThan(0.95);
  });

  it('staggers: earlier items lead later items through the reveal window', () => {
    const first = chapterItemReveal(0, 4, 0.5);
    const last = chapterItemReveal(3, 4, 0.5);
    expect(first.opacity).toBeGreaterThan(last.opacity);
  });

  it('an exit chapter draws items back up + into depth as you scroll past 0.82', () => {
    const docked = chapterItemReveal(0, 4, 0.7, true);
    const leaving = chapterItemReveal(0, 4, 0.98, true);
    expect(docked.opacity).toBeGreaterThan(0.9);
    expect(leaving.opacity).toBeLessThan(docked.opacity);
    expect(leaving.tz).toBeLessThan(docked.tz); // receded deeper
  });

  it('anchors items on a fan around the top (−π/2), alternating roll sign', () => {
    const a0 = chapterItemAnchor(0, 4);
    const a3 = chapterItemAnchor(3, 4);
    expect(Math.sign(a0.rot)).toBe(-Math.sign(a3.rot));
    expect(a0.dist).toBeGreaterThan(0);
  });
});

describe('process orbit (moons + one card per active moon)', () => {
  it('dock gate rises after the world docks and falls as it leaves', () => {
    expect(procDock(0.2)).toBeCloseTo(0, 2);
    expect(procDock(0.6)).toBeCloseTo(1, 2);
    expect(procDock(1)).toBeCloseTo(0, 2);
  });

  it('the active phase sweeps 0 → n-1 only AFTER the dock completes (first phase stays readable)', () => {
    expect(procActiveFloat(0.3, 4)).toBeCloseTo(0, 2); // before the dock
    // the dock completes at 0.46 (procDock) — the sweep must NOT have started yet, so the first
    // briefing is fully readable once the section is fully visible (owner fix 2026-07-07 #4)
    expect(procActiveFloat(0.48, 4)).toBeCloseTo(0, 2);
    expect(procActiveIndex(procActiveFloat(0.52, 4), 4)).toBe(0);
    expect(procActiveFloat(0.84, 4)).toBeCloseTo(3, 1); // last phase active before the planet leaves
    expect(procActiveIndex(procActiveFloat(0.84, 4), 4)).toBe(3);
  });

  it('each card is fully shown only when its moon is the active phase', () => {
    const dock = 1;
    // active phase ≈ 1 → card 1 bright, card 3 dark
    expect(procCardReveal(1, 1, dock).opacity).toBeGreaterThan(0.9);
    expect(procCardReveal(3, 1, dock).opacity).toBeCloseTo(0, 2);
    // gated to zero while undocked
    expect(procCardReveal(1, 1, 0).opacity).toBe(0);
  });

  it('the active moon rides to the top and is largest', () => {
    const dock = 1;
    const active = procMoon(2, 4, 2, 300, 130, 40, dock); // af=2 → moon 2 active
    const other = procMoon(0, 4, 2, 300, 130, 40, dock);
    expect(active.active).toBe(true);
    expect(active.scale).toBeGreaterThan(other.scale);
    expect(active.y).toBeLessThan(other.y + 1); // rides toward the top (smaller/again y)
  });
});

describe('grid fan', () => {
  it('spreads on arrival, collapses to 0 when settled, RTL-mirrored', () => {
    expect(gridFan(0, 4, 0.5)).toBeCloseTo(0, 5); // settled
    expect(Math.abs(gridFan(0, 4, 0))).toBeGreaterThan(0); // spread at edge
    expect(gridFan(0, 4, 0, -1)).toBeCloseTo(-gridFan(0, 4, 0, 1), 5);
  });
});

describe('footer reveal', () => {
  it('stays hidden until the last stretch of the impact scroll', () => {
    // impactTop 5000, height 3000, vh 1000 → scrollable 2000
    expect(footerReveal(5000, 5000, 3000, 1000)).toBe(0); // raw 0
    expect(footerReveal(5900, 5000, 3000, 1000)).toBe(0); // raw 0.45 → below the 0.6 gate
    expect(footerReveal(7000, 5000, 3000, 1000)).toBe(1); // raw 1 → fully revealed
  });

  it('midpoint of the reveal band is ~0.5', () => {
    // raw 0.75 sits at the middle of the 0.6→0.9 band
    expect(footerReveal(6500, 5000, 3000, 1000)).toBeCloseTo(0.5, 5);
  });
});

describe('embers', () => {
  it('staggers start times across the window', () => {
    expect(emberDelay(0, 12)).toBe(0);
    expect(emberDelay(6, 12)).toBeCloseTo(2.5, 5);
    expect(emberDelay(11, 12)).toBeGreaterThan(emberDelay(0, 12));
  });

  it('rises and shrinks and fades over its phase', () => {
    expect(emberTransform(0).translateYvh).toBeCloseTo(0, 5);
    expect(emberTransform(1).translateYvh).toBeCloseTo(-66, 5);
    expect(emberTransform(1).scale).toBeCloseTo(0.2, 5);
    expect(emberTransform(1).opacity).toBeCloseTo(0, 5);
    expect(emberTransform(0.1).opacity).toBeGreaterThan(0.5); // faded in
  });

  it('emberSpec is deterministic and stays within the reference ranges', () => {
    const a = emberSpec(3, 12);
    const b = emberSpec(3, 12);
    expect(a).toEqual(b); // deterministic from index (no Math.random)
    for (let i = 0; i < 12; i += 1) {
      const s = emberSpec(i, 12);
      expect(s.sizePx).toBeGreaterThanOrEqual(2.5);
      expect(s.sizePx).toBeLessThanOrEqual(5);
      expect(s.bottomPct).toBeGreaterThanOrEqual(29);
      expect(s.bottomPct).toBeLessThanOrEqual(35);
      expect(s.durationS).toBeGreaterThanOrEqual(6.5);
      expect(s.durationS).toBeLessThanOrEqual(10);
      expect(s.delayS).toBeGreaterThanOrEqual(0);
      expect(s.delayS).toBeLessThanOrEqual(5);
      expect(s.colorIndex).toBeGreaterThanOrEqual(0);
      expect(s.colorIndex).toBeLessThanOrEqual(3);
      expect(Number.isInteger(s.colorIndex)).toBe(true);
    }
  });

  it('emberSpec spreads sparks (indices differ)', () => {
    expect(emberSpec(0, 12).delayS).not.toBe(emberSpec(1, 12).delayS);
    const colors = new Set(
      Array.from({ length: 12 }, (_, i) => emberSpec(i, 12).colorIndex),
    );
    expect(colors.size).toBeGreaterThan(1); // more than one colour used
  });
});

describe('foot-item stagger', () => {
  it('reveals items in order as the footer opacity climbs', () => {
    // low footer opacity → nothing shown
    expect(footItemReveal(0, 0.4).opacity).toBe(0);
    // full opacity → all shown, settled
    const first = footItemReveal(0, 1);
    expect(first.opacity).toBe(1);
    expect(first.translateY).toBe(0);
    // earlier items are further along than later ones at a mid opacity
    const midFirst = footItemReveal(0, 0.65);
    const midLate = footItemReveal(5, 0.65);
    expect(midFirst.opacity).toBeGreaterThanOrEqual(midLate.opacity);
  });
});
