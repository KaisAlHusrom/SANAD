import type { LocalizedText } from '@sanad/contracts';

/**
 * Constants for the multi-step request-a-project form (P8.E-5, U18). The choice cards write a
 * canonical English `value` onto the lead's optional `projectType`/`budget` fields (admin-readable
 * in the leads inbox), while the localized `label` is what the visitor sees. No backend/contract
 * change — these fields already exist on `leadCreateRequestSchema`.
 */

/** One selectable choice: a canonical stored `value` + the localized `label` shown on the card. */
export interface RequestOption {
  value: string;
  label: LocalizedText;
}

function t(ar: string, en: string): LocalizedText {
  return { ar, en };
}

/** Project types → the lead's `projectType`. Mirrors the services Sanad builds (WEB1). */
export const PROJECT_TYPES: readonly RequestOption[] = [
  { value: 'SaaS platform', label: t('منصّة SaaS', 'SaaS platform') },
  { value: 'Mobile app', label: t('تطبيق جوّال', 'Mobile app') },
  { value: 'LMS', label: t('منصّة تعليمية (LMS)', 'Learning platform (LMS)') },
  { value: 'ERP', label: t('نظام موارد (ERP)', 'ERP system') },
  { value: 'Website', label: t('موقع إلكتروني', 'Website') },
  { value: 'Other', label: t('شيء آخر', 'Something else') },
];

/** Budget bands → the lead's `budget`. "Not sure yet" keeps the field always answered. */
export const BUDGET_BANDS: readonly RequestOption[] = [
  { value: '< 15,000 SAR', label: t('أقل من 15,000 ر.س', 'Under 15,000 SAR') },
  {
    value: '15,000–50,000 SAR',
    label: t('15,000 – 50,000 ر.س', '15,000–50,000 SAR'),
  },
  {
    value: '50,000–150,000 SAR',
    label: t('50,000 – 150,000 ر.س', '50,000–150,000 SAR'),
  },
  { value: '150,000+ SAR', label: t('أكثر من 150,000 ر.س', '150,000+ SAR') },
  { value: 'Not sure yet', label: t('لست متأكّدًا بعد', 'Not sure yet') },
];

/** The total number of steps (Project → Brief → You) — the "Step X of N" label + progress width. */
export const REQUEST_STEP_COUNT = 3;
