import { describe, expect, it } from 'vitest';
import { detailOrbit, detailSeed } from './detail-orbit';

describe('detailSeed (slug → deterministic 0..1)', () => {
  it('is stable per slug and differs across slugs', () => {
    expect(detailSeed('web-development')).toBe(detailSeed('web-development'));
    expect(detailSeed('web-development')).not.toBe(detailSeed('erp'));
    for (const slug of ['erp', 'saas', 'تطوير', 'mobile-apps']) {
      const seed = detailSeed(slug);
      expect(seed).toBeGreaterThanOrEqual(0);
      expect(seed).toBeLessThan(1);
    }
  });
});

describe('detailOrbit (every service is its OWN planet)', () => {
  it('varies ring tilt and moon phases with the seed', () => {
    const a = detailOrbit(0, 0, detailSeed('erp'));
    const b = detailOrbit(0, 0, detailSeed('saas'));
    expect(a.ringTilt).not.toBeCloseTo(b.ringTilt, 3);
    expect(a.moonAngles[0]).not.toBeCloseTo(b.moonAngles[0] ?? 0, 3);
  });

  it('keeps the ring tilt in a readable band', () => {
    for (let s = 0; s < 1; s += 0.1) {
      const state = detailOrbit(0, 0, s);
      expect(state.ringTilt).toBeGreaterThan(0.2);
      expect(state.ringTilt).toBeLessThan(0.95);
    }
  });

  it('advances the spin with time AND scroll (orbital advance)', () => {
    const seed = detailSeed('erp');
    const t0 = detailOrbit(0, 0, seed);
    const t1 = detailOrbit(10, 0, seed);
    const scrolled = detailOrbit(0, 0.5, seed);
    expect(t1.planetSpin).toBeGreaterThan(t0.planetSpin);
    expect(scrolled.planetSpin).toBeGreaterThan(t0.planetSpin);
    expect(t1.moonAngles[0]).not.toBeCloseTo(t0.moonAngles[0] ?? 0, 3);
  });
});
