import { describe, expect, it } from 'vitest';
import { cardTilt, normalizedInCard } from './card-tilt';

describe('normalizedInCard', () => {
  const rect = { left: 100, top: 200, width: 300, height: 150 };

  it('maps the card centre to (0,0) and the corners to ±1', () => {
    expect(normalizedInCard(250, 275, rect)).toEqual({ nx: 0, ny: 0 });
    expect(normalizedInCard(100, 200, rect)).toEqual({ nx: -1, ny: -1 });
    expect(normalizedInCard(400, 350, rect)).toEqual({ nx: 1, ny: 1 });
  });

  it('clamps a pointer that has slid past the card edge', () => {
    expect(normalizedInCard(1000, -50, rect)).toEqual({ nx: 1, ny: -1 });
  });

  it('is safe on a zero-size rect', () => {
    expect(
      normalizedInCard(5, 5, { left: 0, top: 0, width: 0, height: 0 }),
    ).toEqual({
      nx: 0,
      ny: 0,
    });
  });
});

describe('cardTilt (the front card leans toward the pointer)', () => {
  it('is flat at the centre and tilts within ±6°', () => {
    expect(cardTilt(0, 0)).toEqual({ rx: 0, ry: 0 });
    expect(Math.abs(cardTilt(1, 1).rx)).toBeLessThanOrEqual(6);
    expect(Math.abs(cardTilt(1, 1).ry)).toBeLessThanOrEqual(6);
  });

  it('tilts toward the pointer: top edge → leans back, start edge → leans that way', () => {
    // pointer at the top (ny −1) → positive rotateX (top recedes toward the viewer's push)
    expect(cardTilt(0, -1).rx).toBeGreaterThan(0);
    expect(cardTilt(0, 1).rx).toBeLessThan(0);
    expect(cardTilt(-1, 0).ry).toBeLessThan(0);
    expect(cardTilt(1, 0).ry).toBeGreaterThan(0);
  });

  it('clamps runaway inputs', () => {
    expect(cardTilt(5, 5)).toEqual(cardTilt(1, 1));
  });
});
