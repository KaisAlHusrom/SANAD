import { isLocale } from '../i18n/locale-route';
import type { Locale } from '@sanad/contracts';

/**
 * Prefix an internal CMS menu url with the active locale (both `/ar` + `/en`). External
 * (http), anchor (#), and `mailto:` links pass through untouched; an already-locale-prefixed
 * path is left as-is (no double prefix).
 */
export function localizeHref(url: string, locale: Locale): string {
  if (
    /^https?:\/\//.test(url) ||
    url.startsWith('#') ||
    url.startsWith('mailto:')
  ) {
    return url;
  }
  if (url.startsWith('/')) {
    const firstSegment = url.split('/')[1] ?? '';
    if (isLocale(firstSegment)) return url;
    return url === '/' ? `/${locale}` : `/${locale}${url}`;
  }
  return url;
}
