import type { Locale } from '@sanad/contracts';
import { ar } from './dictionaries/ar';
import { en } from './dictionaries/en';

/** The website's UI-chrome dictionary shape (the `ar` catalog is the source of truth). */
export type Dictionary = typeof ar;

const dictionaries: Record<Locale, Dictionary> = { ar, en };

/**
 * Resolve the UI-chrome dictionary for a locale (F13 — registered eagerly, no async
 * effect). Server components read this directly; ar is the default.
 */
export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}
