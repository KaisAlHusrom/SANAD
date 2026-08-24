import type { Locale } from '@sanad/contracts';

/**
 * Cache one formatter per locale (F8 — never inline `Intl.*` at a call site).
 *
 * This exists because three call sites had `join('، ')` — the **Arabic** comma, hardcoded in a
 * component, so an English reader saw "Meta pixel، TikTok pixel". A separator is a user-facing
 * string; `Intl.ListFormat` knows the right one (and the right conjunction) for both locales.
 */
const formatters = new Map<Locale, Intl.ListFormat>();

function formatterFor(locale: Locale): Intl.ListFormat {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.ListFormat(locale, {
      style: 'long',
      type: 'conjunction',
    });
    formatters.set(locale, formatter);
  }
  return formatter;
}

/** Locale-aware "a, b and c" — the ONE place `Intl.ListFormat` lives (F8). */
export function formatList(items: readonly string[], locale: Locale): string {
  return formatterFor(locale).format(items);
}
