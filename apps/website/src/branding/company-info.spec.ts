import { describe, expect, it } from 'vitest';
import type { BrandingRecord } from '@sanad/contracts';
import {
  contactAddress,
  contactEmail,
  copyrightLine,
  shareImageUrl,
  siteUrl,
  socialLinks,
  twitterHandle,
} from './company-info';

function branding(partial: unknown): BrandingRecord {
  return partial as BrandingRecord;
}

describe('company-info (the one source both footers read)', () => {
  it('lists only the social links that are set, in a stable order', () => {
    const links = socialLinks(
      branding({
        social: {
          twitter: 'https://x.com/sanadtech',
          linkedin: null,
          instagram: '',
          github: 'https://github.com/sanad',
          youtube: null,
        },
      }),
    );
    expect(links.map((l) => l.key)).toEqual(['twitter', 'github']);
    expect(links[0]?.label).toBe('X');
  });

  it('returns no links when social is unset (never renders an empty pill)', () => {
    expect(socialLinks(null)).toEqual([]);
    expect(socialLinks(branding({}))).toEqual([]);
  });

  it('composes the brand name INTO the copyright so a rename updates every footer', () => {
    const line = copyrightLine(
      branding({
        brand: { name: { ar: 'سَنَد', en: 'Sanad' } },
        legal: {
          copyright: { ar: 'جميع الحقوق محفوظة', en: 'All rights reserved' },
        },
      }),
      'en',
      'fallback rights',
      'fallback brand',
    );
    expect(line).toBe('© Sanad — All rights reserved');
  });

  it('falls back to the chrome i18n strings when branding is absent (F7)', () => {
    expect(copyrightLine(null, 'en', 'All rights reserved', 'Sanad Tech')).toBe(
      '© Sanad Tech — All rights reserved',
    );
  });

  it('survives a SPARSE localized leaf instead of crashing or rendering "undefined" (F7)', () => {
    // A degraded/stale cache can carry a half-filled localized object. `pickLocalized` would
    // return undefined here — `.length` on it used to throw, and the copyright rendered the
    // literal string "undefined".
    const sparse = branding({
      brand: { name: { ar: '' } },
      legal: { copyright: {} },
      contact: { address: { en: '' } },
    });
    expect(contactAddress(sparse, 'ar')).toBeNull();
    expect(copyrightLine(sparse, 'ar', 'حقوق', 'سَنَد')).toBe('© سَنَد — حقوق');
    expect(copyrightLine(sparse, 'ar', 'حقوق', 'سَنَد')).not.toContain(
      'undefined',
    );
  });

  it('derives the twitter handle from the profile URL (no redundant setting)', () => {
    expect(
      twitterHandle(
        branding({ social: { twitter: 'https://x.com/sanadtech' } }),
      ),
    ).toBe('@sanadtech');
    expect(
      twitterHandle(
        branding({ social: { twitter: 'https://twitter.com/@sanad_tech' } }),
      ),
    ).toBe('@sanad_tech');
    expect(twitterHandle(branding({ social: { twitter: null } }))).toBeNull();
    expect(
      twitterHandle(branding({ social: { twitter: 'not-a-url' } })),
    ).toBeNull();
  });

  it('normalises the site url and reads contact leaves null-safely', () => {
    expect(siteUrl(branding({ seo: { siteUrl: 'https://sanad.tech/' } }))).toBe(
      'https://sanad.tech',
    );
    expect(siteUrl(null)).toBeNull();
    expect(shareImageUrl(branding({ seo: { shareImageUrl: '' } }))).toBeNull();
    expect(contactEmail(branding({ contact: { email: 'a@b.co' } }))).toBe(
      'a@b.co',
    );
    expect(contactEmail(branding({ contact: { email: null } }))).toBeNull();
    expect(
      contactAddress(
        branding({ contact: { address: { ar: 'الرياض', en: 'Riyadh' } } }),
        'ar',
      ),
    ).toBe('الرياض');
    expect(
      contactAddress(branding({ contact: { address: null } }), 'ar'),
    ).toBeNull();
  });
});
