import {
  DEFAULT_LOCALE,
  directionForLocale,
  type Locale,
} from '@sanad/contracts';
import { readLocaleFromStorage } from '../../i18n/locale.storage';

/** Apply a locale's lang + direction to the document root. */
export function applyDirectionToDocument(locale: Locale): void {
  const element = document.documentElement;
  element.lang = locale;
  element.dir = directionForLocale(locale);
}

/**
 * Seed lang + direction on the first frame, before React mounts (F12). Reads the
 * persisted locale; defaults to Arabic/RTL (the app default beats the device, F11).
 */
export function seedDirection(): Locale {
  const locale = readLocaleFromStorage() ?? DEFAULT_LOCALE;
  applyDirectionToDocument(locale);
  return locale;
}
