import type { SettingRequirement, SettingType } from '@sanad/contracts';
import { BRANDING_FIELDS, BRANDING_GROUP } from './branding-catalog.js';
import {
  SECURITY_FIELDS,
  SECURITY_GROUP,
  SECURITY_SECTION_RATE_LIMIT,
} from './security-catalog/index.js';

/** A UI catalog descriptor: where a key sits (group → section) + how to render it. */
export interface SettingDescriptor {
  group: string;
  section: string;
  key: string;
  type: SettingType;
  requirement: SettingRequirement;
  options?: readonly string[];
  /** Inclusive range for `number` fields. Declaring it makes the writer enforce it (U0). */
  min?: number;
  max?: number;
}

/** The descriptor for a key, or `undefined` if it is not admin-editable. */
export function descriptorFor(key: string): SettingDescriptor | undefined {
  return SETTING_DESCRIPTORS.find((descriptor) => descriptor.key === key);
}

/** Branding key → admin section (sub-tab). */
const BRANDING_SECTION_BY_ROOT: Readonly<Record<string, string>> = {
  brand: 'identity',
  logoUrl: 'identity',
  faviconUrl: 'identity',
  colors: 'colors',
  contact: 'contact',
  social: 'social',
  legal: 'legal',
  seo: 'seo',
};

/**
 * Every setting the admin may edit — and each one **actually takes effect** somewhere (no dead
 * controls). Two audiences share the one `branding` record:
 *
 * - **Portals** (admin now, client later): `brand.name`, `logoUrl`, `faviconUrl`,
 *   `colors.primary/secondary` → the portal accent + shell chrome, applied live.
 * - **Website**: `brand.tagline` (footer + meta description), `contact.*` + `social.*` (footer),
 *   `legal.copyright` (both footers), `seo.*` (canonical/OG/sitemap/JSON-LD).
 *
 * DELIBERATELY EXCLUDED because they are the website's own art direction or CMS-owned — exposing
 * them would re-create dead settings: `colors.pageAccents.*` (per-page color lives in the CMS
 * pages settings), `colors.surface.*`/`colors.text.*` (the website's fixed theme), `fonts.*`
 * (a font can't be swapped by name at runtime without shipping its files), `brand.shortDesc`
 * (nothing renders it). They stay in `BrandingRecord`/`BRANDING_DEFAULTS` so `GET /branding`
 * is unchanged. Every key here is a real `BrandingField` (U15) — the descriptor spec guards that.
 */
export const EDITABLE_BRANDING_KEYS: readonly string[] = [
  'branding.brand.name',
  'branding.brand.tagline',
  'branding.logoUrl',
  'branding.faviconUrl',
  'branding.colors.primary',
  'branding.colors.secondary',
  'branding.contact.email',
  'branding.contact.phone',
  'branding.contact.address',
  'branding.social.twitter',
  'branding.social.linkedin',
  'branding.social.instagram',
  'branding.social.github',
  'branding.social.youtube',
  'branding.legal.copyright',
  'branding.seo.siteUrl',
  'branding.seo.shareImageUrl',
];

/**
 * Every security key is editable — each one changes a live rate limit, so there is nothing
 * here that could become a dead control.
 */
export const EDITABLE_SECURITY_KEYS: readonly string[] = SECURITY_FIELDS.map(
  (field) => field.key,
);

/** Every editable key across all groups. */
export const EDITABLE_SETTING_KEYS: readonly string[] = [
  ...EDITABLE_BRANDING_KEYS,
  ...EDITABLE_SECURITY_KEYS,
];

const brandingDescriptors: readonly SettingDescriptor[] =
  BRANDING_FIELDS.filter((field) =>
    EDITABLE_BRANDING_KEYS.includes(field.key),
  ).map((field) => ({
    group: BRANDING_GROUP,
    section: BRANDING_SECTION_BY_ROOT[field.path[0] ?? ''] ?? 'general',
    key: field.key,
    type: field.type,
    requirement: 'optional' as const,
  }));

const securityDescriptors: readonly SettingDescriptor[] = SECURITY_FIELDS.map(
  (field) => ({
    group: SECURITY_GROUP,
    section: SECURITY_SECTION_RATE_LIMIT,
    key: field.key,
    type: field.type,
    requirement: 'optional' as const,
    // The gateway clamps an out-of-range value back to its coded default. Declaring the bounds
    // here is what turns that silent backstop into a NAMED rejection the admin actually sees,
    // instead of a "Settings saved" for a value that never applies (U0).
    ...(field.bounds ? { min: field.bounds.min, max: field.bounds.max } : {}),
  }),
);

/**
 * The descriptor-driven settings catalog the admin renders (group → section → field). The
 * gateway + admin are generic, with no per-group code (U3, the single source of structure) —
 * `security` (P8.10.A) was the first group added after `branding` and needed zero admin
 * component changes, only labels.
 */
export const SETTING_DESCRIPTORS: readonly SettingDescriptor[] = [
  ...brandingDescriptors,
  ...securityDescriptors,
];
