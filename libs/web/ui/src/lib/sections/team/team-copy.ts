import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `team` roster section (F7/WEB1) — the safety net so the head is never
 * blank. Lives WITH the shared component (single source): the website (live) and the admin preview
 * show the identical fallback. Byte-copied from the website's `ABOUT_COPY.team` so the swap introduces
 * no copy regression.
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const TEAM_SECTION_COPY = {
  eyebrow: t('الفريق', 'The team'),
  title: t('عقولٌ تعمل في اتّجاهٍ واحد', 'Minds pulling in one direction'),
};
