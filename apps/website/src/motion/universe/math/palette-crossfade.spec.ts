import { describe, expect, it } from 'vitest';
import { FLIGHT } from '../constants';
import { FLIGHT_PLANS } from '../plans/flight-plans';
import { mixTriplet, paletteMix, voidDip } from './palette-crossfade';

const inter = FLIGHT_PLANS['landing>services'];
const intra = FLIGHT_PLANS['services>serviceDetail'];
if (!inter || !intra) throw new Error('missing plans');

describe('paletteMix (0 = origin tint, 1 = destination tint)', () => {
  it('starts at the origin and hands the departure share over to the cruise', () => {
    expect(paletteMix('departure', 0, inter)).toBe(0);
    expect(paletteMix('departure', 1, inter)).toBeCloseTo(
      FLIGHT.PALETTE_DEPART_SHARE,
      5,
    );
    expect(paletteMix('cruise', 0, inter)).toBeCloseTo(
      FLIGHT.PALETTE_DEPART_SHARE,
      5,
    );
  });

  it('reaches the destination tint by the end of the cruise and holds through arrival', () => {
    expect(paletteMix('cruise', 1, inter)).toBe(1);
    expect(paletteMix('arrival', 0.5, inter)).toBe(1);
    expect(paletteMix('idle', 0, inter)).toBe(1);
  });

  it('monotonically rises through a cruise (no tint flicker)', () => {
    let prev = -1;
    for (let t = 0; t <= 1.001; t += 0.05) {
      const v = paletteMix('cruise', Math.min(t, 1), inter);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('finishes an intra hop (no cruise) inside the leading slice of arrival', () => {
    expect(paletteMix('cruise', 1, intra)).toBeCloseTo(
      FLIGHT.PALETTE_DEPART_SHARE,
      5,
    );
    expect(paletteMix('arrival', 0, intra)).toBeCloseTo(
      FLIGHT.PALETTE_DEPART_SHARE,
      5,
    );
    expect(paletteMix('arrival', FLIGHT.PALETTE_ARRIVAL_WINDOW, intra)).toBe(1);
    expect(paletteMix('arrival', 1, intra)).toBe(1);
  });
});

describe('voidDip (the mid-cruise plunge toward deep black on mid-dip curves)', () => {
  it('peaks mid-cruise for a mid-dip plan and stays 0 elsewhere', () => {
    expect(voidDip('cruise', 0.5, inter)).toBeCloseTo(FLIGHT.VOID_DIP, 5);
    expect(voidDip('cruise', 0, inter)).toBeCloseTo(0, 5);
    expect(voidDip('cruise', 1, inter)).toBeCloseTo(0, 5);
    expect(voidDip('departure', 0.5, inter)).toBe(0);
    expect(voidDip('arrival', 0.5, inter)).toBe(0);
  });

  it('is flat for linear-curve plans', () => {
    expect(voidDip('cruise', 0.5, intra)).toBe(0);
  });
});

describe('mixTriplet', () => {
  it('lerps each channel', () => {
    expect(mixTriplet([0, 0, 0], [1, 0.5, 0.2], 0.5)).toEqual([0.5, 0.25, 0.1]);
    expect(mixTriplet([0.2, 0.4, 0.6], [1, 1, 1], 0)).toEqual([0.2, 0.4, 0.6]);
    expect(mixTriplet([0.2, 0.4, 0.6], [1, 1, 1], 1)).toEqual([1, 1, 1]);
  });
});
