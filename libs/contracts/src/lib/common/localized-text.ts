import { z } from 'zod';
import { DEFAULT_LOCALE, type Locale } from './locale.js';

/**
 * A translatable string carried in every supported locale. Both locales are
 * required so content never renders blank (U8 parity, F7 null-safety upstream).
 */
export const localizedTextSchema = z
  .object({
    ar: z.string(),
    en: z.string(),
  })
  .strict();

export type LocalizedText = z.infer<typeof localizedTextSchema>;

/**
 * Pick the string for a locale, falling back to the default locale and then to
 * any non-empty value, so the UI always has something to render.
 */
export function pickLocalized(text: LocalizedText, locale: Locale): string {
  return text[locale] || text[DEFAULT_LOCALE] || text.ar || text.en;
}
