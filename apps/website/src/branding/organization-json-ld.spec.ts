import { describe, expect, it } from 'vitest';
import type { BrandingRecord } from '@sanad/contracts';
import { buildOrganizationJsonLd } from './organization-json-ld';

function branding(partial: unknown): BrandingRecord {
  return {
    brand: {
      name: { ar: 'سَنَد', en: 'Sanad' },
      tagline: { ar: 'سند', en: 'Backing you' },
      shortDesc: { ar: '', en: '' },
    },
    logoUrl: null,
    social: {
      twitter: null,
      linkedin: null,
      instagram: null,
      github: null,
      youtube: null,
    },
    contact: { email: null, phone: null, address: null },
    seo: { siteUrl: null, shareImageUrl: null },
    ...(partial as object),
  } as BrandingRecord;
}

describe('Organization JSON-LD', () => {
  it('composes name, url, sameAs and contact from the settings', () => {
    const data = buildOrganizationJsonLd(
      branding({
        logoUrl: 'https://cdn.test/logo.png',
        seo: { siteUrl: 'https://sanad.tech', shareImageUrl: null },
        social: {
          twitter: 'https://x.com/sanadtech',
          linkedin: 'https://linkedin.com/company/sanad',
          instagram: null,
          github: null,
          youtube: null,
        },
        contact: {
          email: 'hi@sanad.tech',
          phone: '+966500000000',
          address: null,
        },
      }),
      'en',
    );

    expect(data?.['@type']).toBe('Organization');
    expect(data?.name).toBe('Sanad');
    expect(data?.url).toBe('https://sanad.tech');
    expect(data?.logo).toBe('https://cdn.test/logo.png');
    expect(data?.sameAs).toEqual([
      'https://x.com/sanadtech',
      'https://linkedin.com/company/sanad',
    ]);
    expect(data?.contactPoint).toMatchObject({
      email: 'hi@sanad.tech',
      telephone: '+966500000000',
    });
  });

  it('omits unset leaves rather than emitting nulls (still valid JSON-LD, F7)', () => {
    const data = buildOrganizationJsonLd(branding({}), 'en');
    expect(data).not.toBeNull();
    expect(data).not.toHaveProperty('url');
    expect(data).not.toHaveProperty('logo');
    expect(data).not.toHaveProperty('sameAs');
    expect(data).not.toHaveProperty('contactPoint');
    expect(data).not.toHaveProperty('address');
  });

  it('absolutises a root-relative logo against the site url', () => {
    const data = buildOrganizationJsonLd(
      branding({
        logoUrl: '/brand/logo.png',
        seo: { siteUrl: 'https://sanad.tech', shareImageUrl: null },
      }),
      'en',
    );
    expect(data?.logo).toBe('https://sanad.tech/brand/logo.png');
  });

  it('renders nothing without a branding record', () => {
    expect(buildOrganizationJsonLd(null, 'ar')).toBeNull();
  });
});
