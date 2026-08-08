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

/**
 * The SPARSE counterpart of `pickLocalized`, for callers holding a possibly-incomplete record — a
 * stale cache, a degraded fetch, or a deep-partial settings leaf (F7). Returns `null` (never
 * `undefined`, never the string `"undefined"`) when no locale carries text, so the caller decides
 * the fallback instead of rendering a broken value or crashing on `.length`.
 */
export function pickLocalizedPartial(
  text: Partial<LocalizedText> | null | undefined,
  locale: Locale,
): string | null {
  if (!text) return null;
  const value = text[locale] || text[DEFAULT_LOCALE] || text.ar || text.en;
  return value !== undefined && value.length > 0 ? value : null;
}
