import { describe, expect, it } from 'vitest';
import {
  worksFrontIndex,
  worksOrbitTransform,
  worksTurnProgress,
} from './orbit-geometry.js';

describe('worksTurnProgress (the ring holds, then turns once)', () => {
  it('holds at 0 until the cards have arrived, then ramps to a full turn', () => {
    expect(worksTurnProgress(0)).toBe(0);
    expect(worksTurnProgress(0.45)).toBe(0); // still held
    expect(worksTurnProgress(0.95)).toBe(1); // one full turn by the release
    expect(worksTurnProgress(0.7)).toBeCloseTo(0.5, 5); // half the window
  });
});

describe('worksFrontIndex (the NN/NN orbit counter)', () => {
  it('names card 0 at the hold and cycles through every card across the turn', () => {
    expect(worksFrontIndex(0, 5)).toBe(0);
    expect(worksFrontIndex(0.45, 5)).toBe(0); // the ring is still held static
    const seen = new Set<number>();
    for (let local = 0; local < 1; local += 0.02)
      seen.add(worksFrontIndex(local, 5));
    expect(seen.size).toBe(5); // every card takes the front over the turn
  });

  it('a front index always lines up with the max-depth card', () => {
    for (let local = 0.45; local < 0.95; local += 0.05) {
      const front = worksFrontIndex(local, 5);
      const depths = Array.from(
        { length: 5 },
        (_, i) => worksOrbitTransform(i, 5, local, 100).depth,
      );
      const maxDepth = Math.max(...depths);
      expect(depths[front]).toBeCloseTo(maxDepth, 1);
    }
  });

  it('mirrors under RTL and is safe for an empty ring', () => {
    expect(worksFrontIndex(0.6, 4, -1)).not.toBe(worksFrontIndex(0.6, 4, 1));
    expect(worksFrontIndex(0.4, 0)).toBe(0);
  });
});

describe('worksOrbitTransform (cards around the spine)', () => {
  it('holds the ring STATIC — first card at the front — until the cards have fully arrived', () => {
    const arriving = worksOrbitTransform(0, 5, 0.3, 400);
    const settled = worksOrbitTransform(0, 5, 0.45, 400);
    expect(arriving.x).toBeCloseTo(settled.x, 5); // no rotation yet
    expect(settled.depth).toBeCloseTo(1, 5); // card 0 is the front card at the hold
    expect(settled.opacity).toBeGreaterThan(0.5); // and it is visible
  });

  it('settles to identity-ish sizes and fans front vs back', () => {
    const front = worksOrbitTransform(0, 5, 0.45, 400);
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
    expect(worksOrbitTransform(0, 5, 0.97, 400).opacity).toBeCloseTo(0, 2); // exit sync
    const ltr = worksOrbitTransform(0, 5, 0.6, 400, 1);
    const rtl = worksOrbitTransform(0, 5, 0.6, 400, -1);
    expect(rtl.x).toBeCloseTo(-ltr.x, 5); // WEB6 mirror
    expect(Math.abs(ltr.x)).toBeGreaterThan(1); // the turn has actually moved the card
  });

  it('only the front-most card is interactive (pointer gate)', () => {
    expect(worksOrbitTransform(0, 5, 0.45, 400).pointerEvents).toBe('auto');
    expect(worksOrbitTransform(2, 5, 0.45, 400).pointerEvents).toBe('none');
  });
});
