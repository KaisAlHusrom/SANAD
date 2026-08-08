import { describe, expect, it } from 'vitest';
import { dirForLocale, isLocale, resolveLocaleRedirect } from './locale-route';

describe('locale-route', () => {
  it('dirForLocale: ar→rtl (default), en→ltr', () => {
    expect(dirForLocale('ar')).toBe('rtl');
    expect(dirForLocale('en')).toBe('ltr');
  });

  it('isLocale validates the first path segment', () => {
    expect(isLocale('ar')).toBe(true);
    expect(isLocale('en')).toBe(true);
    expect(isLocale('fr')).toBe(false);
    expect(isLocale('')).toBe(false);
  });

  it('redirects the bare root to /ar (Arabic default)', () => {
    expect(resolveLocaleRedirect('/')).toBe('/ar');
  });

  it('redirects an unknown-locale path to /ar + the rest', () => {
    expect(resolveLocaleRedirect('/services')).toBe('/ar/services');
    expect(resolveLocaleRedirect('/fr/about')).toBe('/ar/fr/about');
  });

  it('does not redirect a path already prefixed with a valid locale', () => {
    expect(resolveLocaleRedirect('/ar')).toBeNull();
    expect(resolveLocaleRedirect('/en/contact')).toBeNull();
    expect(resolveLocaleRedirect('/ar/work/x')).toBeNull();
  });
});
