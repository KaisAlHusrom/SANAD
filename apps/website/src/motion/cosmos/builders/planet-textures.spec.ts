import { describe, expect, it } from 'vitest';
import { RepeatWrapping, Texture } from 'three';
import { makePlanetTexture } from './make-planet-texture';
import { makeRingTexture } from './make-ring-texture';

const PALETTE = [
  [0.8, 0.9, 1],
  [0.2, 0.6, 0.9],
  [0.05, 0.3, 0.5],
] as const;

describe('makePlanetTexture', () => {
  it.each(['gas', 'ice', 'rocky'] as const)(
    'builds a repeat-wrapped texture for %s',
    (type) => {
      const tex = makePlanetTexture(type, PALETTE);
      expect(tex).toBeInstanceOf(Texture);
      expect(tex.wrapS).toBe(RepeatWrapping);
    },
  );

  it.each(['gas', 'ice', 'rocky'] as const)(
    'paints %s at the 8.B-4 close-dock fidelity (1024×512)',
    (type) => {
      const tex = makePlanetTexture(type, PALETTE);
      const image = tex.image as HTMLCanvasElement;
      expect(image.width).toBe(1024);
      expect(image.height).toBe(512);
    },
  );
});

describe('makeRingTexture', () => {
  it('builds a repeat-wrapped ring texture tinted to the glow', () => {
    const tex = makeRingTexture([0.66, 0.33, 0.97]);
    expect(tex).toBeInstanceOf(Texture);
    expect(tex.wrapS).toBe(RepeatWrapping);
  });
});
