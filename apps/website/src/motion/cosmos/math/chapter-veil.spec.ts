import { describe, expect, it } from 'vitest';
import { chapterVeilOpacity } from './chapter-veil';
import { chapterItemReveal } from './chapter-item-reveal';

describe('chapterVeilOpacity (the scrim lives only while the chapter content does)', () => {
  it('is invisible on the approach, before the content gate opens', () => {
    expect(chapterVeilOpacity(0)).toBe(0);
    expect(chapterVeilOpacity(0.29)).toBe(0);
  });

  it('is fully in place through the dock plateau', () => {
    expect(chapterVeilOpacity(0.55)).toBe(1);
    expect(chapterVeilOpacity(0.7)).toBe(1);
  });

  it('is gone again by the end of the exit window (never lingers past the section)', () => {
    expect(chapterVeilOpacity(0.98)).toBe(0);
    expect(chapterVeilOpacity(1)).toBe(0);
  });

  it('rides the content ramp — dark only as the words condense, fading out with them', () => {
    // the first words reveal from local 0.30 — the scrim rises on the same ramp, never alone
    expect(chapterVeilOpacity(0.3)).toBe(0);
    const firstItemMidRamp = chapterItemReveal(0, 3, 0.4, true);
    const veilMidRamp = chapterVeilOpacity(0.4);
    expect(veilMidRamp).toBeGreaterThan(0.2);
    expect(Math.abs(veilMidRamp - firstItemMidRamp.opacity)).toBeLessThan(0.45);
    // mid-exit both are fading together
    expect(chapterVeilOpacity(0.9)).toBeGreaterThan(0);
    expect(chapterVeilOpacity(0.9)).toBeLessThan(1);
  });
});
