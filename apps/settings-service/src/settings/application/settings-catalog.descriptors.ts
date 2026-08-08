import type { SettingRequirement, SettingType } from '@sanad/contracts';
import { BRANDING_FIELDS, BRANDING_GROUP } from './branding-catalog.js';

/** A UI catalog descriptor: where a key sits (group → section) + how to render it. */
export interface SettingDescriptor {
  group: string;
  section: string;
  key: string;
  type: SettingType;
  requirement: SettingRequirement;
  options?: readonly string[];
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
export const EDITABLE_SETTING_KEYS: readonly string[] = [
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

const brandingDescriptors: readonly SettingDescriptor[] =
  BRANDING_FIELDS.filter((field) =>
    EDITABLE_SETTING_KEYS.includes(field.key),
  ).map((field) => ({
    group: BRANDING_GROUP,
    section: BRANDING_SECTION_BY_ROOT[field.path[0] ?? ''] ?? 'general',
    key: field.key,
    type: field.type,
    requirement: 'optional' as const,
  }));

/**
 * The descriptor-driven settings catalog the admin renders (group → section → field). Today
 * `branding` is the only group; future groups append here and surface automatically — the
 * gateway + admin are generic, with no per-group code (U3, the single source of structure).
 */
export const SETTING_DESCRIPTORS: readonly SettingDescriptor[] = [
  ...brandingDescriptors,
];
