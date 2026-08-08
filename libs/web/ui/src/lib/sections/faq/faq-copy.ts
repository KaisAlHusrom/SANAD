import type { FaqCategory, LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `faq` accordion section (F7/WEB1) — the head fallback + the human labels
 * for the `faq_category` enum. Lives WITH the shared component (single source): the website (live)
 * and the admin preview show the identical fallback. Byte-copied from the website's `FAQ_COPY.list` +
 * `FAQ_CATEGORY_LABEL` so the swap introduces no copy regression.
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const FAQ_SECTION_COPY = {
  eyebrow: t('٠١ · الأسئلة', '01 · QUESTIONS'),
  title: t('إجاباتٌ مباشرة', 'Straight answers'),
};

/** Human labels for the `faq_category` enum (shown as a muted tag on each answer). */
export const FAQ_CATEGORY_LABEL: Record<FaqCategory, LocalizedText> = {
  general: t('عام', 'General'),
  pricing: t('الأسعار', 'Pricing'),
  process: t('آلية العمل', 'Process'),
  support: t('الدعم', 'Support'),
};
