import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `trust` domain-constellation chapter (F7/WEB1) — the safety net so the
 * section head is never blank. Lives WITH the shared component (single source): the website (live)
 * and the admin preview show the identical fallback. Byte-copied from the website's
 * `LANDING_COPY.trust` so the swap introduces no copy regression. The constellation STARS come from
 * the section's hydrated `portfolio` collection (categories + live counts), not from copy.
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const TRUST_COPY = {
  eyebrow: t('٠١ · المجالات', '01 · DOMAINS'),
  title: t(
    'الأنظمة التي تُشغّل أعمال المنطقة',
    'The systems that run the region’s business',
  ),
  lead: t(
    'أنظمةٌ حيّة يعتمد عليها الناس كلَّ يوم — من المدفوعات والتجارة إلى اللوجستيات والموارد البشرية والصحة الرقمية.',
    'Live systems people rely on every day — from payments and commerce to logistics, HR and digital health.',
  ),
} as const;
