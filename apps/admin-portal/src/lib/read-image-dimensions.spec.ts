import { afterEach, describe, expect, it, vi } from 'vitest';
import { readImageDimensions } from './read-image-dimensions';

/** A minimal stub for the global Image that fires onload with given natural dimensions. */
function stubImage(width: number, height: number, fail = false) {
  class StubImage {
    onload: (() => void) | null = null;
    onerror: (() => void) | null = null;
    naturalWidth = width;
    naturalHeight = height;
    set src(_value: string) {
      queueMicrotask(() => (fail ? this.onerror?.() : this.onload?.()));
    }
  }
  vi.stubGlobal('Image', StubImage);
  vi.stubGlobal('URL', {
    createObjectURL: () => 'blob:stub',
    revokeObjectURL: () => undefined,
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('readImageDimensions', () => {
  it('resolves the natural dimensions for an image file', async () => {
    stubImage(640, 480);
    const file = new File([new Uint8Array([1])], 'a.png', {
      type: 'image/png',
    });
    await expect(readImageDimensions(file)).resolves.toEqual({
      width: 640,
      height: 480,
    });
  });

  it('resolves undefined for a non-image file (no decode attempted)', async () => {
    const file = new File([new Uint8Array([1])], 'a.pdf', {
      type: 'application/pdf',
    });
    await expect(readImageDimensions(file)).resolves.toBeUndefined();
  });

  it('resolves undefined when the image fails to load', async () => {
    stubImage(0, 0, true);
    const file = new File([new Uint8Array([1])], 'broken.png', {
      type: 'image/png',
    });
    await expect(readImageDimensions(file)).resolves.toBeUndefined();
  });
});
