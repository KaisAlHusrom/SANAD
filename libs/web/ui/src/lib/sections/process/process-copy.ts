import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `process` phased-delivery section (F7/WEB1). Lives WITH the shared
 * component (single source): the website (live) and the admin preview show the identical fallback.
 * Byte-copied from the website's `LANDING_COPY.process` so the swap introduces no copy regression.
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const PROCESS_COPY = {
  eyebrow: t('٠٣ · آلية العمل', '03 · METHOD'),
  title: t('مسارٌ واضح، مرحلةً تلو الأخرى', 'A clear path, phase by phase'),
  /** the "what you receive" label above each phase's deliverable bullets. */
  give: t('ماذا تستلم', 'What you receive'),
};
