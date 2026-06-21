import { describe, expect, it } from 'vitest';
import { localizedTextSchema, pickLocalized } from './localized-text.js';

describe('localized-text', () => {
  it('requires both locales and rejects unknown keys', () => {
    expect(
      localizedTextSchema.safeParse({ ar: 'مرحبا', en: 'Hi' }).success,
    ).toBe(true);
    expect(localizedTextSchema.safeParse({ ar: 'مرحبا' }).success).toBe(false);
    expect(
      localizedTextSchema.safeParse({ ar: 'a', en: 'b', fr: 'c' }).success,
    ).toBe(false);
  });

  it('picks the requested locale, falling back to default', () => {
    const text = { ar: 'مرحبا', en: 'Hello' };
    expect(pickLocalized(text, 'en')).toBe('Hello');
    expect(pickLocalized(text, 'ar')).toBe('مرحبا');
    expect(pickLocalized({ ar: 'مرحبا', en: '' }, 'en')).toBe('مرحبا');
  });
});
