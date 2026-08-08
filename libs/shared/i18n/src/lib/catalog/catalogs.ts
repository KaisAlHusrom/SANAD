import type { Locale } from '@sanad/contracts';
import { AR_CATALOG } from './ar.catalog.js';
import { EN_CATALOG } from './en.catalog.js';

/** The catalogs indexed by locale — the single lookup table `translate()` reads (U3). */
export const CATALOGS: Record<Locale, Record<string, string>> = {
  ar: AR_CATALOG,
  en: EN_CATALOG,
};
