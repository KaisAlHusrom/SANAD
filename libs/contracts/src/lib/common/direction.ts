import { z } from 'zod';
import type { Locale } from './locale.js';

/** Text/layout direction. RTL is the default because Arabic is the default locale (U7). */
export const directionSchema = z.enum(['rtl', 'ltr']);

export type Direction = z.infer<typeof directionSchema>;

/** Resolve the layout direction for a locale. */
export function directionForLocale(locale: Locale): Direction {
  return locale === 'ar' ? 'rtl' : 'ltr';
}
