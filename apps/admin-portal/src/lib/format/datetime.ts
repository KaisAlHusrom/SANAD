import type { Locale } from '@sanad/contracts';

/**
 * Cache one formatter per locale (F8 — cache formatter instances, never inline `Intl.*`
 * at a call site). Western numerals everywhere is a locked design decision (U8), so the
 * `latn` numbering system is forced even for the Arabic locale.
 */
const formatters = new Map<Locale, Intl.DateTimeFormat>();

function formatterFor(locale: Locale): Intl.DateTimeFormat {
  let formatter = formatters.get(locale);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat(locale, {
      dateStyle: 'medium',
      timeStyle: 'short',
      numberingSystem: 'latn',
    });
    formatters.set(locale, formatter);
  }
  return formatter;
}

/** Locale-aware date+time display — the ONE place `Intl.DateTimeFormat` lives (F8). */
export function formatDateTime(iso: string, locale: Locale): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return formatterFor(locale).format(date);
}
