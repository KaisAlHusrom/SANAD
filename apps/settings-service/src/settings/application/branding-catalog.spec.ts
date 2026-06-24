import { describe, expect, it } from 'vitest';
import { fonts, pageAccents, websiteTokens } from '@sanad/config';
import {
  BRANDING_DEFAULTS,
  BRANDING_FIELDS,
  SETTINGS_DEFAULTS,
} from './branding-catalog.js';

describe('branding catalog defaults', () => {
  it('composes colors + fonts from the locked design tokens (drift guard, U6)', () => {
    expect(BRANDING_DEFAULTS.colors.primary).toBe(pageAccents.landing.accent);
    expect(BRANDING_DEFAULTS.colors.pageAccents.about).toEqual(
      pageAccents.about,
    );
    expect(BRANDING_DEFAULTS.colors.surface).toEqual(websiteTokens.surface);
    expect(BRANDING_DEFAULTS.colors.text).toEqual(websiteTokens.text);
    expect(BRANDING_DEFAULTS.fonts.sans).toBe(fonts.sans);
  });

  it('carries the bilingual brand copy and null-by-default leaves', () => {
    expect(BRANDING_DEFAULTS.brand.name).toEqual({
      ar: 'سَنَد التقنية',
      en: 'Sanad Tech',
    });
    expect(BRANDING_DEFAULTS.logoUrl).toBeNull();
    expect(BRANDING_DEFAULTS.contact.email).toBeNull();
    expect(BRANDING_DEFAULTS.social.twitter).toBeNull();
  });

  it('projects every catalog field into the flat SETTINGS_DEFAULTS map', () => {
    expect(Object.keys(SETTINGS_DEFAULTS).length).toBe(BRANDING_FIELDS.length);
    expect(SETTINGS_DEFAULTS['branding.brand.name']).toEqual({
      ar: 'سَنَد التقنية',
      en: 'Sanad Tech',
    });
    expect(SETTINGS_DEFAULTS['branding.colors.primary']).toBe(
      pageAccents.landing.accent,
    );
    expect(SETTINGS_DEFAULTS['branding.logoUrl']).toBeNull();
  });
});
