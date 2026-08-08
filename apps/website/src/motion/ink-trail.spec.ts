import { describe, expect, it } from 'vitest';
import { inkTrailStyle } from './ink-trail';

describe('inkTrailStyle (the thread tightens + brightens over interactive targets)', () => {
  it('keeps the resting taper when nothing is hovered', () => {
    expect(inkTrailStyle(1, 0)).toEqual({ alpha: 0.5, width: 3 });
    expect(inkTrailStyle(0.5, 0)).toEqual({ alpha: 0.25, width: 1.5 });
  });

  it('brightens and narrows over an interactive target', () => {
    const rest = inkTrailStyle(1, 0);
    const hot = inkTrailStyle(1, 1);
    expect(hot.alpha).toBeGreaterThan(rest.alpha);
    expect(hot.width).toBeLessThan(rest.width);
  });

  it('stays a visible thread (never vanishes) and alpha never blows past 1', () => {
    const hot = inkTrailStyle(1, 1);
    expect(hot.width).toBeGreaterThan(1);
    expect(hot.alpha).toBeLessThanOrEqual(1);
    expect(inkTrailStyle(0, 1).alpha).toBe(0);
  });

  it('clamps the hover factor', () => {
    expect(inkTrailStyle(1, 5)).toEqual(inkTrailStyle(1, 1));
  });
});
