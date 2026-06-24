import { describe, expect, it } from 'vitest';
import { buildObjectKey, sanitizeFilename } from './media-key.js';

describe('sanitizeFilename', () => {
  it('lowercases and keeps a safe ascii name with its extension', () => {
    expect(sanitizeFilename('Logo.PNG')).toBe('logo.png');
  });

  it('replaces spaces and unsafe characters with single dashes', () => {
    expect(sanitizeFilename('my brand logo!!.png')).toBe('my-brand-logo.png');
  });

  it('trims leading/trailing separators and dashes adjacent to the dot', () => {
    expect(sanitizeFilename('  --hero--.jpg  ')).toBe('hero.jpg');
  });

  it('falls back to "file" when nothing safe remains (e.g. all-Arabic name)', () => {
    expect(sanitizeFilename('صورة')).toBe('file');
  });
});

describe('buildObjectKey', () => {
  it('namespaces the key under uploads/<assetId>/<sanitized filename>', () => {
    expect(
      buildObjectKey('11111111-1111-1111-1111-111111111111', 'My File.PDF'),
    ).toBe('uploads/11111111-1111-1111-1111-111111111111/my-file.pdf');
  });
});
