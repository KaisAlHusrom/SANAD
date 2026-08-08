/**
 * Slug generation for the smart slug field (U21 UX): produce a contract-valid slug
 * (`^[a-z0-9]+(?:-[a-z0-9]+)*$`, see `content-slug.zod.types.ts`) from any title.
 *
 * Arabic-first (U7/U8): the default title is Arabic, but slugs must be latin a-z0-9. So we
 * transliterate Arabic letters → a latin approximation, strip tashkeel/tatweel first, then
 * fall through the generic kebab-case pipeline. Latin/number input passes straight through.
 */

const MAX_LENGTH = 160;

/** Arabic letter → latin approximation (single source for the transliteration). */
const ARABIC_MAP: Record<string, string> = {
  ا: 'a',
  أ: 'a',
  إ: 'a',
  آ: 'a',
  ب: 'b',
  ت: 't',
  ث: 'th',
  ج: 'j',
  ح: 'h',
  خ: 'kh',
  د: 'd',
  ذ: 'dh',
  ر: 'r',
  ز: 'z',
  س: 's',
  ش: 'sh',
  ص: 's',
  ض: 'd',
  ط: 't',
  ظ: 'z',
  ع: 'a',
  غ: 'gh',
  ف: 'f',
  ق: 'q',
  ك: 'k',
  ل: 'l',
  م: 'm',
  ن: 'n',
  ه: 'h',
  ة: 'h',
  و: 'w',
  ي: 'y',
  ى: 'a',
  ئ: 'y',
  ؤ: 'w',
  ء: '',
  // Arabic-Indic + Eastern-Arabic digits → latin
  '٠': '0',
  '١': '1',
  '٢': '2',
  '٣': '3',
  '٤': '4',
  '٥': '5',
  '٦': '6',
  '٧': '7',
  '٨': '8',
  '٩': '9',
};

/** Tashkeel (harakat) + tatweel — dropped before transliteration. */
const ARABIC_DIACRITICS = /[ً-ْـ]/g;

function transliterate(input: string): string {
  let out = '';
  for (const char of input.replace(ARABIC_DIACRITICS, '')) {
    out += ARABIC_MAP[char] ?? char;
  }
  return out;
}

/** Build a contract-valid slug from a free-text title (latin or Arabic). */
export function slugify(input: string): string {
  return transliterate(input)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_LENGTH)
    .replace(/-+$/g, '');
}
