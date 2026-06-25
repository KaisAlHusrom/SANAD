import type {
  BrandingRecord,
  BrandingUpdateRequest,
  LocalizedText,
  PageAccent,
} from '@sanad/contracts';
import type { BrandingFormValues } from '../validation/branding-form.zod.types';

function ltChanged(a: LocalizedText, b: LocalizedText): boolean {
  return a.ar !== b.ar || a.en !== b.en;
}
/** A nullable leaf changed when its `'' ↔ null` normalized value differs. */
function nullableChanged(original: string | null, value: string): boolean {
  return (original ?? '') !== value;
}
function toNull(value: string): string | null {
  return value === '' ? null : value;
}

type ColorsUpdate = NonNullable<BrandingUpdateRequest['colors']>;
type AccentUpdate = NonNullable<
  NonNullable<ColorsUpdate['pageAccents']>['landing']
>;

const PAGE_KEYS = ['landing', 'about', 'services', 'serviceDetail'] as const;
const SURFACE_KEYS = ['bg', 'track', 's1', 's2'] as const;
const TEXT_KEYS = ['base', 'dim', 'muted', 'faint'] as const;
const ACCENT_KEYS = ['accent', 'secondary', 'ink'] as const;

function diffAccent(
  original: PageAccent,
  value: PageAccent,
): AccentUpdate | undefined {
  const out: AccentUpdate = {};
  for (const key of ACCENT_KEYS) {
    if (original[key] !== value[key]) out[key] = value[key];
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function diffColors(
  original: BrandingRecord['colors'],
  value: BrandingFormValues['colors'],
): ColorsUpdate | undefined {
  const out: ColorsUpdate = {};
  if (original.primary !== value.primary) out.primary = value.primary;
  if (original.secondary !== value.secondary) out.secondary = value.secondary;

  const pageAccents: NonNullable<ColorsUpdate['pageAccents']> = {};
  for (const page of PAGE_KEYS) {
    const accent = diffAccent(
      original.pageAccents[page],
      value.pageAccents[page],
    );
    if (accent) pageAccents[page] = accent;
  }
  if (Object.keys(pageAccents).length > 0) out.pageAccents = pageAccents;

  const surface: NonNullable<ColorsUpdate['surface']> = {};
  for (const key of SURFACE_KEYS) {
    if (original.surface[key] !== value.surface[key])
      surface[key] = value.surface[key];
  }
  if (Object.keys(surface).length > 0) out.surface = surface;

  const text: NonNullable<ColorsUpdate['text']> = {};
  for (const key of TEXT_KEYS) {
    if (original.text[key] !== value.text[key]) text[key] = value.text[key];
  }
  if (Object.keys(text).length > 0) out.text = text;

  return Object.keys(out).length > 0 ? out : undefined;
}

/**
 * Diff the resolved record against the current form values → a deep-partial
 * `BrandingUpdateRequest` carrying ONLY changed leaves (the heart of P7.B). Rules:
 *  - each `LocalizedText` is a whole-object leaf — sent in full `{ar,en}` if either side
 *    changed (the schema requires the full object when present);
 *  - nullable leaves map `'' → null` (clearing a logo/social/contact value);
 *  - an unchanged form produces `{}` (the caller treats that as a no-op).
 */
export function diffBranding(
  original: BrandingRecord,
  values: BrandingFormValues,
): BrandingUpdateRequest {
  const out: BrandingUpdateRequest = {};

  const brand: NonNullable<BrandingUpdateRequest['brand']> = {};
  if (ltChanged(original.brand.name, values.brand.name))
    brand.name = { ...values.brand.name };
  if (ltChanged(original.brand.tagline, values.brand.tagline)) {
    brand.tagline = { ...values.brand.tagline };
  }
  if (ltChanged(original.brand.shortDesc, values.brand.shortDesc)) {
    brand.shortDesc = { ...values.brand.shortDesc };
  }
  if (Object.keys(brand).length > 0) out.brand = brand;

  if (nullableChanged(original.logoUrl, values.logoUrl))
    out.logoUrl = toNull(values.logoUrl);
  if (nullableChanged(original.faviconUrl, values.faviconUrl)) {
    out.faviconUrl = toNull(values.faviconUrl);
  }

  const colors = diffColors(original.colors, values.colors);
  if (colors) out.colors = colors;

  const fonts: NonNullable<BrandingUpdateRequest['fonts']> = {};
  if (original.fonts.sans !== values.fonts.sans) fonts.sans = values.fonts.sans;
  if (original.fonts.mono !== values.fonts.mono) fonts.mono = values.fonts.mono;
  if (Object.keys(fonts).length > 0) out.fonts = fonts;

  const social: NonNullable<BrandingUpdateRequest['social']> = {};
  if (nullableChanged(original.social.twitter, values.social.twitter)) {
    social.twitter = toNull(values.social.twitter);
  }
  if (nullableChanged(original.social.linkedin, values.social.linkedin)) {
    social.linkedin = toNull(values.social.linkedin);
  }
  if (nullableChanged(original.social.instagram, values.social.instagram)) {
    social.instagram = toNull(values.social.instagram);
  }
  if (nullableChanged(original.social.github, values.social.github)) {
    social.github = toNull(values.social.github);
  }
  if (nullableChanged(original.social.youtube, values.social.youtube)) {
    social.youtube = toNull(values.social.youtube);
  }
  if (Object.keys(social).length > 0) out.social = social;

  const contact: NonNullable<BrandingUpdateRequest['contact']> = {};
  if (nullableChanged(original.contact.email, values.contact.email)) {
    contact.email = toNull(values.contact.email);
  }
  if (nullableChanged(original.contact.phone, values.contact.phone)) {
    contact.phone = toNull(values.contact.phone);
  }
  const originalAddress = original.contact.address ?? { ar: '', en: '' };
  if (ltChanged(originalAddress, values.contact.address)) {
    const { ar, en } = values.contact.address;
    contact.address = ar === '' && en === '' ? null : { ar, en };
  }
  if (Object.keys(contact).length > 0) out.contact = contact;

  return out;
}
