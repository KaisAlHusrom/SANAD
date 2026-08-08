import { describe, expect, it } from 'vitest';
import { BRANDING_FIELDS } from './branding-catalog.js';
import {
  EDITABLE_SETTING_KEYS,
  SETTING_DESCRIPTORS,
} from './settings-catalog.descriptors.js';

describe('settings catalog descriptors', () => {
  it('exposes exactly the editable keys — nothing dead, nothing hidden', () => {
    const shown = SETTING_DESCRIPTORS.map((d) => d.key);
    expect(new Set(shown)).toEqual(new Set(EDITABLE_SETTING_KEYS));
  });

  it('every shown key is a real branding field (no invented keys, U15)', () => {
    const known = new Set(BRANDING_FIELDS.map((f) => f.key));
    for (const key of EDITABLE_SETTING_KEYS) {
      expect(known.has(key)).toBe(true);
    }
  });

  it('groups the keys into the six admin sections', () => {
    const sections = new Set(SETTING_DESCRIPTORS.map((d) => d.section));
    expect(sections).toEqual(
      new Set(['identity', 'colors', 'contact', 'social', 'legal', 'seo']),
    );
  });

  it('hides the website art-direction / CMS-owned leaves (they would be dead controls)', () => {
    const shown = new Set(SETTING_DESCRIPTORS.map((d) => d.key));
    // Per-page color lives in the CMS pages settings; surfaces/text are the website's fixed
    // theme; fonts can't be runtime-swapped by name; nothing renders shortDesc.
    expect(shown.has('branding.colors.pageAccents.landing.accent')).toBe(false);
    expect(shown.has('branding.colors.surface.bg')).toBe(false);
    expect(shown.has('branding.colors.text.base')).toBe(false);
    expect(shown.has('branding.fonts.sans')).toBe(false);
    expect(shown.has('branding.brand.shortDesc')).toBe(false);
  });

  it('exposes the company-info + SEO keys the website renders', () => {
    const shown = new Set(SETTING_DESCRIPTORS.map((d) => d.key));
    expect(shown.has('branding.legal.copyright')).toBe(true);
    expect(shown.has('branding.social.linkedin')).toBe(true);
    expect(shown.has('branding.contact.email')).toBe(true);
    expect(shown.has('branding.seo.siteUrl')).toBe(true);
    expect(shown.has('branding.brand.tagline')).toBe(true);
  });
});
