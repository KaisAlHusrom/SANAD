import { describe, expect, it } from 'vitest';
import {
  LOCALE_HEADER,
  localeToHeaders,
  resolveRequestLocale,
} from './request-locale.js';

describe('resolveRequestLocale (U24)', () => {
  it('prefers the explicit x-sanad-locale header — the in-app language wins (F11)', () => {
    expect(
      resolveRequestLocale({
        [LOCALE_HEADER]: 'en',
        'accept-language': 'ar,en;q=0.9',
      }),
    ).toBe('en');
  });

  it('falls back to accept-language when the app header is absent', () => {
    expect(resolveRequestLocale({ 'accept-language': 'en-GB,en;q=0.9' })).toBe(
      'en',
    );
  });

  it('picks the first SUPPORTED language from accept-language', () => {
    expect(
      resolveRequestLocale({ 'accept-language': 'fr-FR,de;q=0.8,ar;q=0.7' }),
    ).toBe('ar');
  });

  it('defaults to Arabic — no headers, unknown language, or an unsupported app header', () => {
    expect(resolveRequestLocale({})).toBe('ar');
    expect(resolveRequestLocale(undefined)).toBe('ar');
    expect(resolveRequestLocale({ 'accept-language': 'fr-FR,de;q=0.8' })).toBe(
      'ar',
    );
    expect(resolveRequestLocale({ [LOCALE_HEADER]: 'de' })).toBe('ar');
    expect(resolveRequestLocale({ [LOCALE_HEADER]: '' })).toBe('ar');
  });

  it('accepts a header array (Node lowercases + may repeat headers)', () => {
    expect(resolveRequestLocale({ [LOCALE_HEADER]: ['en'] })).toBe('en');
  });

  it('is case-insensitive about the locale value', () => {
    expect(resolveRequestLocale({ [LOCALE_HEADER]: 'EN' })).toBe('en');
  });

  it('reads the RMQ headers the gateway forwards (MS4)', () => {
    expect(resolveRequestLocale(localeToHeaders('en'))).toBe('en');
    expect(localeToHeaders('ar')).toEqual({ [LOCALE_HEADER]: 'ar' });
  });
});
