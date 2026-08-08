import {
  DEFAULT_LOCALE,
  LOCALE_HEADER,
  toLocale,
  type Locale,
} from '@sanad/contracts';

// The header name + the string→Locale narrowing are CONTRACTS (U3) — the browser apps set the
// same header without importing this Nest-dependent package. Re-exported for backend callers.
export { LOCALE_HEADER };

/** Headers a producer attaches: HTTP request headers, or an AMQP header map. */
export type LocaleCarrier = Record<string, unknown> | undefined;

function firstValue(raw: unknown): string | null {
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && typeof raw[0] === 'string') return raw[0];
  return null;
}

/**
 * Pick the first supported language out of an `Accept-Language` header, honouring its order
 * (`ar,en;q=0.9` → `ar`). Weights are not re-sorted: browsers already send the list in
 * preference order, and the in-app header (F11) is what really decides anyway.
 */
function fromAcceptLanguage(raw: string | null): Locale | null {
  if (!raw) return null;
  for (const part of raw.split(',')) {
    const tag = part.split(';')[0]?.trim() ?? '';
    // `en-GB` → `en`
    const locale = toLocale(tag.split('-')[0] ?? '');
    if (locale) return locale;
  }
  return null;
}

/**
 * Resolve the locale of an inbound request (U24). Precedence: the explicit **`x-sanad-locale`**
 * (the user's in-app language, which beats the device — F11) → **`accept-language`** →
 * **`ar`**, the product default (U8). Never throws: an unsupported value degrades to Arabic.
 */
export function resolveRequestLocale(headers: LocaleCarrier): Locale {
  return (
    toLocale(firstValue(headers?.[LOCALE_HEADER])) ??
    fromAcceptLanguage(firstValue(headers?.['accept-language'])) ??
    DEFAULT_LOCALE
  );
}

/** Serialize the locale into a headers map (frontend→gateway, gateway→service). */
export function localeToHeaders(locale: Locale): Record<string, string> {
  return { [LOCALE_HEADER]: locale };
}
