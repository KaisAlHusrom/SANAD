import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the WEB10 `work` orbit chapter (F7/WEB1) — the safety net so the section
 * head + the card labels are never blank. Lives WITH the shared component (single source): the
 * website (live) and the admin preview show the identical fallback. Byte-copied from the website's
 * `LANDING_COPY.works` so the swap introduces no copy regression. The case-study CARDS come from the
 * section's hydrated `portfolio` collection (title/client/challenge/result/cover), not from copy.
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const WORKS_COPY = {
  eyebrow: t('٠٤ · أعمالنا', '04 · OUR WORK'),
  title: t('أعمالٌ تتحدّث بالأرقام', 'Work that speaks in numbers'),
  lead: t(
    'مشاريع أطلقناها لعملاء حقيقيين — ونتائجها قابلة للقياس.',
    'Projects we shipped for real clients — with measurable results.',
  ),
  challenge: t('التحدّي', 'CHALLENGE'),
} as const;
