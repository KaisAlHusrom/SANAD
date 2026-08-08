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
    expect(SETTINGS_DEFAULTS['branding.brand.name']).toEqual({
      ar: 'سَنَد التقنية',
      en: 'Sanad Tech',
    });
    expect(SETTINGS_DEFAULTS['branding.colors.primary']).toBe(
      pageAccents.landing.accent,
    );
    expect(SETTINGS_DEFAULTS['branding.logoUrl']).toBeNull();
  });

  it('has a BRANDING_FIELDS entry for EVERY leaf of the record (nothing unsettable)', () => {
    // NOT `keys(SETTINGS_DEFAULTS).length === BRANDING_FIELDS.length` — that is tautological
    // (SETTINGS_DEFAULTS is built BY mapping BRANDING_FIELDS, so it can never disagree). This
    // walks the RECORD instead, so adding a leaf to `BRANDING_DEFAULTS` without a matching
    // field — which would make it permanently unsettable, the exact class of bug behind
    // "I changed the setting and nothing happened" — fails here.
    const leaves = walkLeafPaths(BRANDING_DEFAULTS).map((p) => `branding.${p}`);
    const fields = BRANDING_FIELDS.map((f) => f.key);
    expect(new Set(leaves)).toEqual(new Set(fields));
  });
});

/**
 * Every leaf path of the branding record. A `{ ar, en }` localized object counts as ONE leaf
 * (it is a single `localized_text` setting), and `null` leaves (logo/social/contact) count too.
 */
function walkLeafPaths(node: unknown, path: readonly string[] = []): string[] {
  if (node === null || typeof node !== 'object') {
    return [path.join('.')];
  }
  const keys = Object.keys(node as Record<string, unknown>);
  const isLocalized =
    keys.length === 2 && keys.includes('ar') && keys.includes('en');
  if (isLocalized) {
    return [path.join('.')];
  }
  return keys.flatMap((key) =>
    walkLeafPaths((node as Record<string, unknown>)[key], [...path, key]),
  );
}
