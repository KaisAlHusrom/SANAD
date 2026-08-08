import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `stats` section (F7/WEB1) — the safety net rendered when the CMS has
 * no value yet, so the section is never blank. Lives WITH the shared component (single source), so
 * the website (live) and the admin preview show the identical fallback. Mirrors the seeded landing.
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const STATS_COPY = {
  eyebrow: t('٠٥ · بالأرقام', '05 · TELEMETRY'),
  title: t('أرقامٌ تختصر الرحلة', 'The numbers behind the voyage'),
};
