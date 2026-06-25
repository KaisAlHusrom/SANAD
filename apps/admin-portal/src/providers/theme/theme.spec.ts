import { afterEach, describe, expect, it } from 'vitest';
import { applyThemeToDocument, seedTheme } from './seed-theme';
import { readThemeFromStorage, writeTheme } from './theme.storage';

afterEach(() => {
  localStorage.clear();
  document.documentElement.removeAttribute('data-theme');
});

describe('theme', () => {
  it('defaults to dark when storage is empty (F11/F12)', () => {
    expect(seedTheme()).toBe('dark');
    expect(document.documentElement.dataset.theme).toBe('dark');
  });

  it('round-trips a stored theme', () => {
    writeTheme('light');
    expect(readThemeFromStorage()).toBe('light');
    expect(seedTheme()).toBe('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });

  it('applies a theme to the document', () => {
    applyThemeToDocument('light');
    expect(document.documentElement.dataset.theme).toBe('light');
  });
});
