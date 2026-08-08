import { DEFAULT_LOCALE, localeSchema, type Locale } from './locale.js';

/**
 * The header the caller's locale rides in (U24c). It is a **contract**, not an implementation
 * detail: each frontend's single header place sets it, the gateway resolves it, and the gateway
 * forwards it to the services in the RMQ headers. Lives here — not in `@sanad/i18n` — so the
 * browser apps can use it without pulling a NestJS-dependent package into their bundle.
 */
export const LOCALE_HEADER = 'x-sanad-locale';

/** Narrow an arbitrary string (a stored preference, `i18n.language`, a route param) to a Locale. */
export function toLocale(raw: string | null | undefined): Locale | null {
  if (!raw) return null;
  const parsed = localeSchema.safeParse(raw.trim().toLowerCase());
  return parsed.success ? parsed.data : null;
}

/** The same, falling back to Arabic — the product default (U8) — instead of null. */
export function resolveLocale(raw: string | null | undefined): Locale {
  return toLocale(raw) ?? DEFAULT_LOCALE;
}
