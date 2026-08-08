import { describe, expect, it } from 'vitest';
import { hasMessage, translate, translateMessage } from './translate.js';

describe('translate (U24)', () => {
  it('renders a key in the requested locale', () => {
    expect(translate('common.ok', 'ar')).toBe('تم');
    expect(translate('common.ok', 'en')).toBe('OK');
  });

  it('interpolates {name} params', () => {
    expect(translate('media.notFound', 'en', { id: 'abc-123' })).toContain(
      'abc-123',
    );
    expect(translate('media.notFound', 'ar', { id: 'abc-123' })).toContain(
      'abc-123',
    );
  });

  it('interpolates a numeric param', () => {
    const text = translate('media.upload.tooLarge', 'en', { maxMb: 25 });
    expect(text).toContain('25');
  });

  it('leaves an unfilled placeholder empty rather than printing {name}', () => {
    // A caller that forgot a param must not leak the placeholder to the owner.
    expect(translate('media.notFound', 'en')).not.toContain('{id}');
  });

  it('falls back to Arabic — the default locale — for an unsupported locale', () => {
    // `resolveRequestLocale` guarantees a valid Locale, but a message crossing an
    // older service could still carry something else; ar is the product default (U8).
    expect(translate('common.ok', 'de' as unknown as 'ar')).toBe('تم');
  });

  it('passes an unknown key through unchanged (legacy prose degrades, never shows a raw key)', () => {
    expect(translate('Connected — bucket is reachable.', 'ar')).toBe(
      'Connected — bucket is reachable.',
    );
    expect(translate('some.unmapped.key', 'ar')).toBe('some.unmapped.key');
  });

  describe('translateMessage', () => {
    it('renders a LocalizedMessage', () => {
      expect(translateMessage({ messageKey: 'common.ok' }, 'en')).toBe('OK');
      expect(
        translateMessage(
          { messageKey: 'media.notFound', params: { id: 'x1' } },
          'en',
        ),
      ).toContain('x1');
    });
  });

  it('does not mistake an Object.prototype member for a key', () => {
    // `'constructor' in catalog` is true — which would hand `interpolate` a FUNCTION and throw.
    expect(hasMessage('constructor')).toBe(false);
    expect(hasMessage('toString')).toBe(false);
    expect(translate('constructor', 'ar')).toBe('constructor');
    expect(translate('hasOwnProperty', 'en')).toBe('hasOwnProperty');
  });

  it('recognizes a real key', () => {
    expect(hasMessage('common.ok')).toBe(true);
    expect(hasMessage('Cannot GET /api/nope')).toBe(false);
  });
});
