import {
  pickLocalizedPartial,
  type BrandingRecord,
  type Locale,
} from '@sanad/contracts';

/**
 * Derives the company-info the site chrome renders from the resolved branding record — the ONE
 * source both footers read, so the global chrome footer and the landing finale can never disagree
 * again (they previously each hardcoded their own name/email/city/copyright). Every helper is
 * null-safe to the leaf and returns `null`/`[]` when unset, so callers just don't render that bit
 * (F7). Pure + server-safe: no dates, no DOM.
 */

/** A deeply-optional branding shape — a stale/absent fetch must never crash the chrome (F7). */
type DeepPartial<T> = T extends object
  ? { [K in keyof T]?: DeepPartial<T[K]> }
  : T;

type Branding = DeepPartial<BrandingRecord> | null | undefined;

/**
 * The coded-default brand name (U9/F7) — mirrors the settings-service `BRANDING_DEFAULTS`, used
 * only when the branding fetch degrades. One constant so the chrome can't render three different
 * spellings of the company (the landing footer used to carry an unvocalized variant).
 */
export const FALLBACK_BRAND_NAME: Record<Locale, string> = {
  ar: 'سَنَد التقنية',
  en: 'Sanad Tech',
};

export interface SocialLink {
  key: string;
  href: string;
  label: string;
}

/** Display labels for the social networks (the design uses text pills, like the team cards). */
const SOCIAL_LABELS = [
  ['twitter', 'X'],
  ['linkedin', 'LinkedIn'],
  ['instagram', 'Instagram'],
  ['github', 'GitHub'],
  ['youtube', 'YouTube'],
] as const;

/** The set social links, in a stable order. Unset links are omitted (never an empty pill). */
export function socialLinks(branding: Branding): SocialLink[] {
  const social = branding?.social;
  if (!social) return [];
  const links: SocialLink[] = [];
  for (const [key, label] of SOCIAL_LABELS) {
    const href = social[key];
    if (typeof href === 'string' && href.length > 0) {
      links.push({ key, href, label });
    }
  }
  return links;
}

/**
 * The copyright line: `© {brand name} — {copyright notice}`. The brand name is composed in from
 * `brand.name` rather than baked into the notice, so renaming the company updates every footer.
 * `fallbackRights` is the chrome i18n string, used only if the setting resolves empty.
 */
export function copyrightLine(
  branding: Branding,
  locale: Locale,
  fallbackRights: string,
  fallbackBrand: string,
): string {
  const name =
    pickLocalizedPartial(branding?.brand?.name, locale) ?? fallbackBrand;
  const notice =
    pickLocalizedPartial(branding?.legal?.copyright, locale) ?? fallbackRights;
  return `© ${name} — ${notice}`;
}

/** The contact email, or `null` when unset. */
export function contactEmail(branding: Branding): string | null {
  const email = branding?.contact?.email;
  return typeof email === 'string' && email.length > 0 ? email : null;
}

/** The contact phone, or `null` when unset. */
export function contactPhone(branding: Branding): string | null {
  const phone = branding?.contact?.phone;
  return typeof phone === 'string' && phone.length > 0 ? phone : null;
}

/** The localized address, or `null` when unset. */
export function contactAddress(
  branding: Branding,
  locale: Locale,
): string | null {
  return pickLocalizedPartial(branding?.contact?.address, locale);
}

/**
 * The `twitter:site` handle for OG cards, derived from the X/Twitter profile URL — so there is no
 * redundant "handle" setting to keep in sync with the link. `null` if unset/unparseable.
 */
export function twitterHandle(branding: Branding): string | null {
  const url = branding?.social?.twitter;
  if (typeof url !== 'string' || url.length === 0) return null;
  const match = /(?:twitter\.com|x\.com)\/@?([A-Za-z0-9_]{1,15})/.exec(url);
  return match?.[1] ? `@${match[1]}` : null;
}

/** The configured public site origin without a trailing slash, or `null` when unset. */
export function siteUrl(branding: Branding): string | null {
  const url = branding?.seo?.siteUrl;
  if (typeof url !== 'string' || url.length === 0) return null;
  return url.replace(/\/+$/, '');
}

/** The default OG/Twitter share image, or `null` when unset. */
export function shareImageUrl(branding: Branding): string | null {
  const url = branding?.seo?.shareImageUrl;
  return typeof url === 'string' && url.length > 0 ? url : null;
}
