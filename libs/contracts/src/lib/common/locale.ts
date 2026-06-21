import { z } from 'zod';

/**
 * Supported locales. Arabic is the default (RTL); English is secondary (LTR).
 * Rules: U8 (ar default, identical key trees), U7 (RTL default).
 */
export const localeSchema = z.enum(['ar', 'en']);

export type Locale = z.infer<typeof localeSchema>;

/** The default locale for the whole platform. */
export const DEFAULT_LOCALE: Locale = 'ar';

/** All supported locales, in display order (default first). */
export const LOCALES: readonly Locale[] = ['ar', 'en'] as const;

/** Endonym (the language's own name) — used in language switchers (U8). */
export const LOCALE_ENDONYMS: Record<Locale, string> = {
  ar: 'العربية',
  en: 'English',
};
