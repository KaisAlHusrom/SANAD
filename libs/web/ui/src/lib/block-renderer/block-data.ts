import type { LocalizedText } from '@sanad/contracts';

/**
 * Typed readers for a `BlockNode.data` (`Record<string, unknown>` on the wire). Each block kind
 * carries a small, known set of non-translatable keys (mirrors the admin's `schema/block-data.ts`
 * writer side); these readers keep the loosely-typed `data` from leaking `unknown` into the JSX
 * (U4) and supply null-safe defaults.
 */

const asString = (value: unknown): string =>
  typeof value === 'string' ? value : value == null ? '' : String(value);

/** `stat` → a big number + an optional suffix (e.g. `120` + `+`). */
export function readStat(data: Record<string, unknown>): {
  value: string;
  suffix: string;
} {
  return { value: asString(data['value']), suffix: asString(data['suffix']) };
}

export type CtaVariant = 'primary' | 'secondary';

/** `cta` → a destination url + a button variant. */
export function readCta(data: Record<string, unknown>): {
  href: string;
  variant: CtaVariant;
} {
  return {
    href: asString(data['href']),
    variant: data['variant'] === 'secondary' ? 'secondary' : 'primary',
  };
}

/** `step` / `feature` → an icon key (a lucide name resolved by `icon-map`). */
export function readIcon(data: Record<string, unknown>): string {
  return asString(data['icon']);
}

/** A plain non-translatable string off a block's `data` bag (e.g. a service's mono `tech`
 *  signature, a collection-join marker). Blank when absent (F7). */
export function readString(data: Record<string, unknown>, key: string): string {
  return asString(data[key]);
}

/**
 * A `LocalizedText` stored INSIDE a block's `data` bag (the one place that happens — a `step`
 * block's mono `duration`). Verifies the `{ar,en}` shape off the loose bag (never casts, U15);
 * returns blank both-locales when absent/malformed so the reader is null-safe (F7).
 */
export function readBlockLocalized(
  data: Record<string, unknown>,
  key: string,
): LocalizedText {
  const raw = data[key];
  if (raw !== null && typeof raw === 'object' && 'ar' in raw && 'en' in raw) {
    const record = raw as Record<string, unknown>;
    return { ar: asString(record['ar']), en: asString(record['en']) };
  }
  return { ar: '', en: '' };
}
