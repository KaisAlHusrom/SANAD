import {
  pickLocalized,
  type BrandingRecord,
  type Locale,
} from '@sanad/contracts';
import {
  contactAddress,
  contactEmail,
  contactPhone,
  siteUrl,
} from './company-info';

/**
 * Builds the schema.org `Organization` object from the branding settings. Only set leaves are
 * emitted — a half-configured record yields a smaller but still VALID object rather than nulls
 * (F7). Pure + exported so it can be unit-tested without rendering.
 */
export function buildOrganizationJsonLd(
  branding: BrandingRecord | null,
  locale: Locale,
): Record<string, unknown> | null {
  if (!branding) return null;

  const origin = siteUrl(branding);
  const email = contactEmail(branding);
  const phone = contactPhone(branding);
  const address = contactAddress(branding, locale);
  // `sameAs` is the canonical place for a company's social profiles.
  const sameAs = Object.values(branding.social ?? {}).filter(
    (url): url is string => typeof url === 'string' && url.length > 0,
  );

  const logo = branding.logoUrl;
  const absoluteLogo =
    logo && origin && logo.startsWith('/') ? `${origin}${logo}` : logo;

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: pickLocalized(branding.brand.name, locale),
    description: pickLocalized(branding.brand.tagline, locale),
    ...(origin ? { url: origin } : {}),
    ...(absoluteLogo ? { logo: absoluteLogo } : {}),
    ...(sameAs.length > 0 ? { sameAs } : {}),
    ...(email || phone
      ? {
          contactPoint: {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            ...(email ? { email } : {}),
            ...(phone ? { telephone: phone } : {}),
          },
        }
      : {}),
    ...(address
      ? { address: { '@type': 'PostalAddress', streetAddress: address } }
      : {}),
  };
}

/**
 * Renders the site-wide `Organization` structured data (server component, one `ld+json` script).
 * Composed entirely from admin settings — brand name/tagline/logo, the SEO site url, the social
 * links (`sameAs`) and the contact details — so keeping the company profile correct in search is
 * an admin task, not a deploy. Renders nothing when branding is unavailable (F7).
 */
export function OrganizationJsonLd({
  branding,
  locale,
}: {
  branding: BrandingRecord | null;
  locale: Locale;
}) {
  const data = buildOrganizationJsonLd(branding, locale);
  if (!data) return null;
  return (
    <script
      type="application/ld+json"
      // Serialized by us from typed settings — not user-authored markup.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
