import { universeSystems } from '@sanad/config';
import { describe, expect, it } from 'vitest';
import { SYSTEM_ACCENTS, SYSTEM_FOGS } from './system-colors';

describe('system color triplets (raw-linear cosmos inputs from the token source)', () => {
  it('covers every universe system with normalized 0..1 triplets', () => {
    for (const system of Object.keys(universeSystems)) {
      for (const triplet of [
        SYSTEM_FOGS[system as never],
        SYSTEM_ACCENTS[system as never],
      ]) {
        expect(triplet).toHaveLength(3);
        for (const channel of triplet as number[]) {
          expect(channel).toBeGreaterThanOrEqual(0);
          expect(channel).toBeLessThanOrEqual(1);
        }
      }
    }
  });

  it('keeps fogs deep-space dark and accents bright (bloom feeds on the contrast)', () => {
    for (const system of Object.keys(
      universeSystems,
    ) as (keyof typeof SYSTEM_FOGS)[]) {
      const fogMax = Math.max(...SYSTEM_FOGS[system]);
      const accentMax = Math.max(...SYSTEM_ACCENTS[system]);
      expect(fogMax).toBeLessThan(0.25);
      expect(accentMax).toBeGreaterThan(0.5);
    }
  });
});
