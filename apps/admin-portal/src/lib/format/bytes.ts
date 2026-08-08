import type { Locale } from '@sanad/contracts';

/**
 * The units `Intl` knows, smallest first — a file size is read as "how big, roughly", so it is
 * always shown in the largest unit that leaves a number above 1.
 */
const UNITS = ['byte', 'kilobyte', 'megabyte', 'gigabyte', 'terabyte'] as const;

/** One formatter per locale+unit (F8 — never inline `Intl.*` at a call site). */
const formatters = new Map<string, Intl.NumberFormat>();

function formatterFor(locale: Locale, unit: string): Intl.NumberFormat {
  const key = `${locale}:${unit}`;
  let formatter = formatters.get(key);
  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      style: 'unit',
      unit,
      unitDisplay: 'short',
      maximumFractionDigits: 1,
      // Western numerals everywhere is a locked design decision (U8).
      numberingSystem: 'latn',
    });
    formatters.set(key, formatter);
  }
  return formatter;
}

/**
 * A human file size in the reader's language — "1.8 GB" / "١.٨"-free Arabic (U8).
 *
 * Anything that isn't a usable positive number formats as zero rather than `NaN B`: a missing
 * size is a gap in the data, and a gap must still render as something a person can read (U23).
 */
export function formatBytes(bytes: number, locale: Locale): string {
  const safe = Number.isFinite(bytes) && bytes > 0 ? bytes : 0;
  let value = safe;
  let index = 0;
  while (value >= 1024 && index < UNITS.length - 1) {
    value /= 1024;
    index += 1;
  }
  return formatterFor(locale, UNITS[index] as string).format(value);
}
