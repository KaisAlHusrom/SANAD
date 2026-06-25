import { i18n } from './i18n';

/** A locale message catalog (nested object of strings). */
export type Catalog = Record<string, unknown>;

/**
 * Register a module's ar/en catalogs under a namespace at IMPORT time (F13) — not in
 * an effect. Key trees must be identical across locales (parity, U8 — verified by
 * `parity.spec.ts` and the project verifier).
 */
export function registerCatalog(
  namespace: string,
  ar: Catalog,
  en: Catalog,
): void {
  i18n.addResourceBundle('ar', namespace, ar, true, true);
  i18n.addResourceBundle('en', namespace, en, true, true);
}
