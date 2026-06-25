import { LOCALES, type Locale } from '@sanad/contracts';

const LOCALE_STORAGE_KEY = 'sanad.admin.locale';

function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

/** Synchronously read the persisted locale (F12); null when unset/invalid. */
export function readLocaleFromStorage(): Locale | null {
  try {
    const value = localStorage.getItem(LOCALE_STORAGE_KEY);
    return value && isLocale(value) ? value : null;
  } catch {
    return null;
  }
}

/** Persist the chosen locale (app setting beats device, F11). */
export function writeLocale(locale: Locale): void {
  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  } catch {
    // ignore storage failures (private mode) — falls back to the default locale
  }
}
