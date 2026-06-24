import { fonts, pageAccents, websiteTokens } from '@sanad/config';
import type { BrandingRecord, SettingType } from '@sanad/contracts';
import { asTree, getAtPath } from './branding-tree.js';
import type { ResolvedValue } from './resolved-value.js';

/** The settings group all branding keys belong to. */
export const BRANDING_GROUP = 'branding';

/**
 * The authoritative coded default branding record (U9). Colors/fonts come from the
 * locked design tokens (`@sanad/config`); the brand copy is the professional default
 * from `.claude/design/content-defaults.md`. Every leaf is present, so a resolve never
 * renders blank (F7). Unset leaves (logo/social/contact) default to `null`.
 */
export const BRANDING_DEFAULTS: BrandingRecord = {
  brand: {
    name: { ar: 'سَنَد التقنية', en: 'Sanad Tech' },
    tagline: {
      ar: 'نُسنِدُك من الفكرة إلى الإطلاق… وما بعده.',
      en: 'Backing you from idea to launch — and beyond.',
    },
    shortDesc: {
      ar: 'بيت برمجيات يبني أنظمة SaaS وتطبيقات الجوال ومنصّات التعلّم وأنظمة ERP، مرحلةً تلو الأخرى.',
      en: 'A software house building SaaS, mobile, LMS and ERP systems — delivered phase by phase.',
    },
  },
  logoUrl: null,
  faviconUrl: null,
  colors: {
    primary: pageAccents.landing.accent,
    secondary: pageAccents.landing.secondary,
    pageAccents: {
      landing: { ...pageAccents.landing },
      about: { ...pageAccents.about },
      services: { ...pageAccents.services },
      serviceDetail: { ...pageAccents.serviceDetail },
    },
    surface: { ...websiteTokens.surface },
    text: { ...websiteTokens.text },
  },
  fonts: { sans: fonts.sans, mono: fonts.mono },
  social: {
    twitter: null,
    linkedin: null,
    instagram: null,
    github: null,
    youtube: null,
  },
  contact: { email: null, phone: null, address: null },
};

/** One configurable branding leaf: its flat key, its path in the record, its type. */
export interface BrandingField {
  key: string;
  path: readonly string[];
  type: SettingType;
}

const PAGE_ACCENT_KEYS = [
  'landing',
  'about',
  'services',
  'serviceDetail',
] as const;
const ACCENT_LEAVES = ['accent', 'secondary', 'ink'] as const;

const pageAccentFields: BrandingField[] = PAGE_ACCENT_KEYS.flatMap((page) =>
  ACCENT_LEAVES.map((leaf) => ({
    key: `branding.colors.pageAccents.${page}.${leaf}`,
    path: ['colors', 'pageAccents', page, leaf],
    type: 'color' as const,
  })),
);

/**
 * The branding catalog: the descriptor list driving seeding, default flattening,
 * group assembly, and update flattening (one source of truth, U3).
 */
export const BRANDING_FIELDS: readonly BrandingField[] = [
  {
    key: 'branding.brand.name',
    path: ['brand', 'name'],
    type: 'localized_text',
  },
  {
    key: 'branding.brand.tagline',
    path: ['brand', 'tagline'],
    type: 'localized_text',
  },
  {
    key: 'branding.brand.shortDesc',
    path: ['brand', 'shortDesc'],
    type: 'localized_text',
  },
  { key: 'branding.logoUrl', path: ['logoUrl'], type: 'image' },
  { key: 'branding.faviconUrl', path: ['faviconUrl'], type: 'image' },
  {
    key: 'branding.colors.primary',
    path: ['colors', 'primary'],
    type: 'color',
  },
  {
    key: 'branding.colors.secondary',
    path: ['colors', 'secondary'],
    type: 'color',
  },
  ...pageAccentFields,
  {
    key: 'branding.colors.surface.bg',
    path: ['colors', 'surface', 'bg'],
    type: 'color',
  },
  {
    key: 'branding.colors.surface.track',
    path: ['colors', 'surface', 'track'],
    type: 'color',
  },
  {
    key: 'branding.colors.surface.s1',
    path: ['colors', 'surface', 's1'],
    type: 'color',
  },
  {
    key: 'branding.colors.surface.s2',
    path: ['colors', 'surface', 's2'],
    type: 'color',
  },
  {
    key: 'branding.colors.text.base',
    path: ['colors', 'text', 'base'],
    type: 'color',
  },
  {
    key: 'branding.colors.text.dim',
    path: ['colors', 'text', 'dim'],
    type: 'color',
  },
  {
    key: 'branding.colors.text.muted',
    path: ['colors', 'text', 'muted'],
    type: 'color',
  },
  {
    key: 'branding.colors.text.faint',
    path: ['colors', 'text', 'faint'],
    type: 'color',
  },
  { key: 'branding.fonts.sans', path: ['fonts', 'sans'], type: 'text' },
  { key: 'branding.fonts.mono', path: ['fonts', 'mono'], type: 'text' },
  { key: 'branding.social.twitter', path: ['social', 'twitter'], type: 'url' },
  {
    key: 'branding.social.linkedin',
    path: ['social', 'linkedin'],
    type: 'url',
  },
  {
    key: 'branding.social.instagram',
    path: ['social', 'instagram'],
    type: 'url',
  },
  { key: 'branding.social.github', path: ['social', 'github'], type: 'url' },
  { key: 'branding.social.youtube', path: ['social', 'youtube'], type: 'url' },
  { key: 'branding.contact.email', path: ['contact', 'email'], type: 'text' },
  { key: 'branding.contact.phone', path: ['contact', 'phone'], type: 'text' },
  {
    key: 'branding.contact.address',
    path: ['contact', 'address'],
    type: 'localized_text',
  },
];

/**
 * The flat-key projection of the coded defaults (`key → ResolvedValue`) — the
 * resolver's terminal fallback and the per-locale fallback source (U9).
 */
export const SETTINGS_DEFAULTS: Readonly<Record<string, ResolvedValue>> =
  Object.fromEntries(
    BRANDING_FIELDS.map((field) => [
      field.key,
      getAtPath(asTree(BRANDING_DEFAULTS), field.path),
    ]),
  );
