import type { LocalizedText } from '@sanad/contracts';

/**
 * Edit-mode placeholders for the `richtext` prose section (WEB1). Unlike hero/cta, a prose section
 * has NO coded default headline — its head is fully author-supplied, so in `live`/`preview` a blank
 * field renders NOTHING (never a canned title; the seeded privacy/terms sections rely on this). These
 * strings are used ONLY as the Content-Studio edit placeholders (a hint in an empty field), never as
 * a live fallback (F7 for prose = "render nothing", not a coded headline).
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const RICH_TEXT_COPY = {
  eyebrow: t('تسمية القسم', 'Section label'),
  title: t('عنوان القسم', 'Section title'),
  lead: t('مقدّمة قصيرة', 'A short intro'),
};
