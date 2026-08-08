import { DEFAULT_LOCALE, LOCALES, type Locale } from '@sanad/contracts';

/** RTL for Arabic (default), LTR for English (U7). Used to set `<html dir>`. */
export function dirForLocale(locale: Locale): 'rtl' | 'ltr' {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

/** Whether a path segment is a supported locale. */
export function isLocale(segment: string): segment is Locale {
  return (LOCALES as readonly string[]).includes(segment);
}

/**
 * Decide the redirect target for an incoming pathname so every page is locale-prefixed
 * (owner decision: both `/ar` + `/en`, `/` → `/ar`). Returns the target path, or `null`
 * when the path already starts with a valid locale (no redirect needed). An unknown first
 * segment is treated as a non-locale path and prefixed with the default locale.
 */
export function resolveLocaleRedirect(pathname: string): string | null {
  const firstSegment = pathname.split('/')[1] ?? '';
  if (isLocale(firstSegment)) return null;
  if (pathname === '/') return `/${DEFAULT_LOCALE}`;
  return `/${DEFAULT_LOCALE}${pathname}`;
}
