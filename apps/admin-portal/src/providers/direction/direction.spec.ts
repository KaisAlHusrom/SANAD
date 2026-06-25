import { afterEach, describe, expect, it } from 'vitest';
import { applyDirectionToDocument, seedDirection } from './seed-direction';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('dir');
  document.documentElement.removeAttribute('lang');
});

describe('direction seed', () => {
  it('applies rtl + ar for Arabic', () => {
    applyDirectionToDocument('ar');
    expect(document.documentElement.dir).toBe('rtl');
    expect(document.documentElement.lang).toBe('ar');
  });

  it('applies ltr for English', () => {
    applyDirectionToDocument('en');
    expect(document.documentElement.dir).toBe('ltr');
    expect(document.documentElement.lang).toBe('en');
  });

  it('defaults to ar/rtl when storage is empty (F12)', () => {
    expect(seedDirection()).toBe('ar');
    expect(document.documentElement.dir).toBe('rtl');
  });

  it('seeds the persisted locale (app beats device, F11)', () => {
    localStorage.setItem('sanad.admin.locale', 'en');
    expect(seedDirection()).toBe('en');
    expect(document.documentElement.dir).toBe('ltr');
  });
});
