import { describe, expect, it } from 'vitest';
import { travelContent } from './travel-content';

describe('travelContent (the DOM content exit/enter progress the PageStage drives)', () => {
  it('is fully present at idle', () => {
    expect(travelContent('idle', 0)).toEqual({ out: 0, in: 1, hidden: false });
  });

  it('leaves progressively through departure', () => {
    expect(travelContent('departure', 0).out).toBe(0);
    const mid = travelContent('departure', 0.5);
    expect(mid.out).toBeGreaterThan(0);
    expect(mid.out).toBeLessThan(1);
    expect(mid.hidden).toBe(false);
    expect(travelContent('departure', 1).out).toBe(1);
  });

  it('is fully hidden through the cruise (the streamed-in new page must never flash)', () => {
    expect(travelContent('cruise', 0)).toEqual({ out: 1, in: 0, hidden: true });
    expect(travelContent('cruise', 1).hidden).toBe(true);
  });

  it('enters progressively through arrival', () => {
    expect(travelContent('arrival', 0).in).toBe(0);
    expect(travelContent('arrival', 0.5).in).toBeGreaterThan(0);
    expect(travelContent('arrival', 1).in).toBe(1);
    expect(travelContent('arrival', 0.5).hidden).toBe(false);
  });
});
