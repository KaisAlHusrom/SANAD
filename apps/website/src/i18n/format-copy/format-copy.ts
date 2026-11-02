import type { Locale } from '@sanad/contracts';

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

/**
 * Formatters are cached, never constructed at a call site (F8) — `Intl.NumberFormat` is one of the
 * more expensive objects in the platform and this runs during render.
 */
const numberFormatters = new Map<Locale, Intl.NumberFormat>();

function formatNumber(value: number, locale: Locale): string {
  let formatter = numberFormatters.get(locale);
  if (!formatter) {
    // `-u-nu-latn`: Arabic would otherwise render Arabic-Indic digits, which would make this one
    // number disagree with every other figure on the site (U8).
    formatter = new Intl.NumberFormat(`${locale}-u-nu-latn`);
    numberFormatters.set(locale, formatter);
  }
  return formatter.format(value);
}

/**
 * Fill `{{name}}` placeholders in a dictionary string. The site has no i18n library — the
 * dictionaries are plain typed objects — so this is the one place interpolation happens.
 */
export function formatCopy(
  template: string,
  params: Readonly<Record<string, string | number>>,
  locale: Locale,
): string {
  return template.replace(PLACEHOLDER, (match, name: string) => {
    const value = params[name];
    if (value === undefined) return match;
    return typeof value === 'number' ? formatNumber(value, locale) : value;
  });
}
