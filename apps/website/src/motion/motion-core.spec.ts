import { describe, expect, it } from 'vitest';
import { splitWords } from './split-words';
import { orbitTransform, worksFrontIndex, worksOrbitTransform } from './orbit';
import { countUpValue } from './count-up';

describe('worksFrontIndex (the NN/NN orbit counter)', () => {
  it('starts at the FIRST card and holds it through the reveal', () => {
    expect(worksFrontIndex(0, 5)).toBe(0);
    expect(worksFrontIndex(0.45, 5)).toBe(0); // the ring is still held static
  });

  it('names the card the ring geometry actually has at the front', () => {
    for (const local of [0.2, 0.5, 0.62, 0.75, 0.9]) {
      const front = worksFrontIndex(local, 5);
      const depths = Array.from(
        { length: 5 },
        (_, i) => worksOrbitTransform(i, 5, local, 100).depth,
      );
      expect(depths[front]).toBeCloseTo(Math.max(...depths), 5);
    }
  });

  it('advances through every card across the turn window', () => {
    const seen = new Set<number>();
    for (let local = 0; local < 1; local += 0.02)
      seen.add(worksFrontIndex(local, 4));
    expect(seen.size).toBe(4);
  });

  it('flips the advance direction under RTL (WEB6)', () => {
    expect(worksFrontIndex(0.6, 4, -1)).not.toBe(worksFrontIndex(0.6, 4, 1));
  });

  it('is safe on an empty ring', () => {
    expect(worksFrontIndex(0.4, 0)).toBe(0);
  });
});

describe('splitWords (WEB5 — word split, never letter)', () => {
  it('splits a heading into whole words', () => {
    expect(splitWords('نَسنِدُك من الفكرة')).toEqual([
      'نَسنِدُك',
      'من',
      'الفكرة',
    ]);
  });

  it('keeps a <br> as an explicit line-break token', () => {
    expect(splitWords('نَسنِدُك من الفكرة<br>إلى الإطلاق')).toEqual([
      'نَسنِدُك',
      'من',
      'الفكرة',
      '\n',
      'إلى',
      'الإطلاق',
    ]);
  });

  it('drops empty/whitespace-only fragments', () => {
    expect(splitWords('  Build   ships  ')).toEqual(['Build', 'ships']);
  });
});

describe('orbitTransform (WEB10 spine geometry)', () => {
  it('spaces cards evenly around the ring at progress 0', () => {
    const a = orbitTransform(0, 4, 0, 100);
    const b = orbitTransform(1, 4, 0, 100);
    // card 0 is at angle 0 (front-right of the ring); card 1 a quarter-turn on
    expect(a.x).toBeCloseTo(100, 5);
    expect(b.x).toBeCloseTo(0, 5);
  });

  it('rotates the whole ring with scroll progress', () => {
    const at0 = orbitTransform(0, 4, 0, 100);
    const atQuarter = orbitTransform(0, 4, 0.25, 100);
    expect(atQuarter.x).not.toBeCloseTo(at0.x, 1);
  });

  it('flips rotation direction under RTL (dir = -1, WEB6)', () => {
    const ltr = orbitTransform(0, 4, 0.1, 100, 1);
    const rtl = orbitTransform(0, 4, 0.1, 100, -1);
    // mirrored across the vertical axis → equal x, opposite-signed vertical tilt
    expect(rtl.x).toBeCloseTo(ltr.x, 5);
    expect(rtl.y).toBeCloseTo(-ltr.y, 5);
  });

  it('front-of-ring cards are larger and more opaque than back', () => {
    // quarter turn: card at angle +90° (front) vs −90° (back)
    const front = orbitTransform(1, 4, 0, 100); // angle 90° → sin 1
    const back = orbitTransform(3, 4, 0, 100); // angle 270° → sin -1
    expect(front.scale).toBeGreaterThan(back.scale);
    expect(front.opacity).toBeGreaterThan(back.opacity);
    expect(front.zIndex).toBeGreaterThan(back.zIndex);
  });
});

describe('countUpValue (stats easing)', () => {
  it('starts at 0 and lands exactly on the target', () => {
    expect(countUpValue(120, 0)).toBe(0);
    expect(countUpValue(120, 1)).toBe(120);
  });

  it('clamps out-of-range progress', () => {
    expect(countUpValue(50, -1)).toBe(0);
    expect(countUpValue(50, 2)).toBe(50);
  });

  it('eases out (past halfway by the time-midpoint)', () => {
    expect(countUpValue(100, 0.5)).toBeGreaterThan(50);
  });
});
