import { describe, expect, it } from 'vitest';
import { AR_CATALOG } from './ar.catalog.js';
import { EN_CATALOG } from './en.catalog.js';

const PLACEHOLDER = /\{(\w+)\}/g;

function placeholdersOf(text: string): string[] {
  return [...text.matchAll(PLACEHOLDER)].map((match) => match[1] ?? '').sort();
}

describe('backend message catalogs (U8 parity, U24)', () => {
  it('has identical key trees in ar and en', () => {
    expect(Object.keys(EN_CATALOG).sort()).toEqual(
      Object.keys(AR_CATALOG).sort(),
    );
  });

  it('has no empty message in either locale', () => {
    for (const [key, text] of Object.entries(AR_CATALOG)) {
      expect(text.trim(), `ar:${key}`).not.toBe('');
    }
    for (const [key, text] of Object.entries(EN_CATALOG)) {
      expect(text.trim(), `en:${key}`).not.toBe('');
    }
  });

  it('uses the same {placeholders} in both locales', () => {
    // A param the Arabic string forgets would silently drop the id/bucket the owner needs.
    for (const key of Object.keys(AR_CATALOG) as (keyof typeof AR_CATALOG)[]) {
      expect(placeholdersOf(AR_CATALOG[key]), `placeholders of ${key}`).toEqual(
        placeholdersOf(EN_CATALOG[key]),
      );
    }
  });

  it('carries real Arabic — never an English string parked in the ar catalog', () => {
    const arabic = /[؀-ۿ]/;
    for (const [key, text] of Object.entries(AR_CATALOG)) {
      expect(arabic.test(text), `ar:${key} has no Arabic letters`).toBe(true);
    }
  });
});
