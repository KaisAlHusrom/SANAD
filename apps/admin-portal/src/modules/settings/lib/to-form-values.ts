import type { BrandingRecord, LocalizedText } from '@sanad/contracts';
import type { BrandingFormValues } from '../validation/branding-form.zod.types';

/** null → '' so a nullable leaf edits as a plain string ('' = unset). */
const str = (value: string | null): string => value ?? '';
const lt = (value: LocalizedText): LocalizedText => ({
  ar: value.ar,
  en: value.en,
});

/**
 * Map the resolved `BrandingRecord` → the edit form's values (F7 — the record is
 * fully resolved, so every leaf is present). Nullable leaves become `''`; the diff maps
 * them back to `null` on submit. Used as RHF `values` so prefill is never dirty (F6).
 */
export function toFormValues(record: BrandingRecord): BrandingFormValues {
  return {
    brand: {
      name: lt(record.brand.name),
      tagline: lt(record.brand.tagline),
      shortDesc: lt(record.brand.shortDesc),
    },
    logoUrl: str(record.logoUrl),
    faviconUrl: str(record.faviconUrl),
    colors: {
      primary: record.colors.primary,
      secondary: record.colors.secondary,
      pageAccents: {
        landing: { ...record.colors.pageAccents.landing },
        about: { ...record.colors.pageAccents.about },
        services: { ...record.colors.pageAccents.services },
        serviceDetail: { ...record.colors.pageAccents.serviceDetail },
      },
      surface: { ...record.colors.surface },
      text: { ...record.colors.text },
    },
    fonts: { sans: record.fonts.sans, mono: record.fonts.mono },
    social: {
      twitter: str(record.social.twitter),
      linkedin: str(record.social.linkedin),
      instagram: str(record.social.instagram),
      github: str(record.social.github),
      youtube: str(record.social.youtube),
    },
    contact: {
      email: str(record.contact.email),
      phone: str(record.contact.phone),
      address: record.contact.address
        ? lt(record.contact.address)
        : { ar: '', en: '' },
    },
  };
}
