import type { LocalizedText } from '@sanad/contracts';

/**
 * Coded-default copy for the `testimonials` received-transmissions wall (F7/WEB1) — the safety net
 * so the section head is never blank. Lives WITH the shared component (single source): the website
 * (live) and the admin preview show the identical fallback. Byte-copied from the website's
 * `LANDING_COPY.testimonials` so the swap introduces no copy regression. The quote CARDS come from
 * the section's hydrated `testimonials` collection (author/quote/rating/avatar), not from copy.
 */
const t = (ar: string, en: string): LocalizedText => ({ ar, en });

export const TESTIMONIALS_COPY = {
  eyebrow: t('٠٦ · إشاراتٌ واردة', '06 · TRANSMISSIONS'),
  title: t(
    'ماذا يقول شركاؤنا بعد الإطلاق',
    'What our partners say after launch',
  ),
} as const;
