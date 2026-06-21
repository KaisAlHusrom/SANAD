import { describe, expect, it } from 'vitest';
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_ENDONYMS,
  localeSchema,
} from './locale.js';

describe('locale', () => {
  it('defaults to Arabic', () => {
    expect(DEFAULT_LOCALE).toBe('ar');
    expect(LOCALES[0]).toBe('ar');
  });

  it('accepts ar and en, rejects others', () => {
    expect(localeSchema.parse('ar')).toBe('ar');
    expect(localeSchema.parse('en')).toBe('en');
    expect(localeSchema.safeParse('fr').success).toBe(false);
  });

  it('exposes endonyms for every locale', () => {
    for (const locale of LOCALES) {
      expect(LOCALE_ENDONYMS[locale]).toBeTruthy();
    }
  });
});
