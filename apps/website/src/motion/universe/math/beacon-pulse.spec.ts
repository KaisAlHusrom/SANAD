import { describe, expect, it } from 'vitest';
import { beaconPulse } from './beacon-pulse';

describe('beaconPulse (the contact relay signal rings)', () => {
  it('expands each ring outward while it fades to nothing', () => {
    const young = beaconPulse(0.2, 0);
    const old = beaconPulse(2.8, 0);
    expect(old.scale).toBeGreaterThan(young.scale);
    expect(old.opacity).toBeLessThan(young.opacity);
    expect(beaconPulse(3.19, 0).opacity).toBeLessThan(0.02);
  });

  it('loops seamlessly on its period', () => {
    const a = beaconPulse(0.5, 0);
    const b = beaconPulse(0.5 + 3.2, 0);
    expect(b.scale).toBeCloseTo(a.scale, 5);
    expect(b.opacity).toBeCloseTo(a.opacity, 5);
  });

  it('staggers rings so the signal is continuous, never a synchronized blink', () => {
    const r0 = beaconPulse(1, 0);
    const r1 = beaconPulse(1, 1);
    const r2 = beaconPulse(1, 2);
    expect(r0.scale).not.toBeCloseTo(r1.scale, 3);
    expect(r1.scale).not.toBeCloseTo(r2.scale, 3);
  });
});
