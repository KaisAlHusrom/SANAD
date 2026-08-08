import { describe, expect, it } from 'vitest';
import { ar } from './dictionaries/ar';
import { en } from './dictionaries/en';
import { getDictionary } from './get-dictionary';

/** All dotted key paths of a nested string record, sorted. */
function keyPaths(obj: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(obj)
    .flatMap(([key, value]) => {
      const path = prefix ? `${prefix}.${key}` : key;
      return value && typeof value === 'object'
        ? keyPaths(value as Record<string, unknown>, path)
        : [path];
    })
    .sort();
}

describe('website i18n parity (U8/F13)', () => {
  it('ar and en have identical key trees', () => {
    expect(keyPaths(en)).toEqual(keyPaths(ar));
  });

  it('every leaf is a non-empty string in both locales', () => {
    for (const locale of ['ar', 'en'] as const) {
      const dict = getDictionary(locale);
      for (const path of keyPaths(dict)) {
        const value = path
          .split('.')
          .reduce<unknown>(
            (node, key) => (node as Record<string, unknown>)[key],
            dict,
          );
        expect(typeof value).toBe('string');
        expect((value as string).length).toBeGreaterThan(0);
      }
    }
  });

  it('getDictionary defaults map ar→ar, en→en', () => {
    expect(getDictionary('ar').nav.home).toBe(ar.nav.home);
    expect(getDictionary('en').nav.home).toBe(en.nav.home);
  });
});
