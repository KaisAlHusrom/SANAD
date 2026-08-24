import {
  SECURITY_GROUP,
  TRACKING_GROUP,
  trackingDestinationSettingKeys,
} from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { BRANDING_FIELDS, BRANDING_GROUP } from './branding-catalog.js';
import { SECURITY_FIELDS } from './security-catalog/security-catalog.js';
import { TRACKING_FIELDS } from './tracking-catalog/tracking-catalog.js';
import {
  EDITABLE_BRANDING_KEYS,
  EDITABLE_SECURITY_KEYS,
  EDITABLE_SETTING_KEYS,
  EDITABLE_TRACKING_KEYS,
  SETTING_DESCRIPTORS,
  descriptorFor,
} from './settings-catalog.descriptors.js';

const keysIn = (group: string): string[] =>
  SETTING_DESCRIPTORS.filter((d) => d.group === group).map((d) => d.key);

describe('settings catalog descriptors', () => {
  it('exposes exactly the editable keys — nothing dead, nothing hidden', () => {
    const shown = SETTING_DESCRIPTORS.map((d) => d.key);
    expect(new Set(shown)).toEqual(new Set(EDITABLE_SETTING_KEYS));
  });

  it('every shown branding key is a real branding field (no invented keys, U15)', () => {
    const known = new Set(BRANDING_FIELDS.map((f) => f.key));
    for (const key of EDITABLE_BRANDING_KEYS) {
      expect(known.has(key)).toBe(true);
    }
  });

  it('every shown security key is a real security field (no invented keys, U15)', () => {
    const known = new Set(SECURITY_FIELDS.map((f) => f.key));
    for (const key of EDITABLE_SECURITY_KEYS) {
      expect(known.has(key)).toBe(true);
    }
  });

  it('every shown tracking key is a real tracking field (no invented keys, U15)', () => {
    const known = new Set(TRACKING_FIELDS.map((f) => f.key));
    for (const key of EDITABLE_TRACKING_KEYS) {
      expect(known.has(key)).toBe(true);
    }
  });

  it('carries exactly the three groups, branding first', () => {
    const groups = [...new Set(SETTING_DESCRIPTORS.map((d) => d.group))];
    expect(groups).toEqual([BRANDING_GROUP, SECURITY_GROUP, TRACKING_GROUP]);
  });

  it('groups the branding keys into the six admin sections', () => {
    const sections = new Set(
      SETTING_DESCRIPTORS.filter((d) => d.group === BRANDING_GROUP).map(
        (d) => d.section,
      ),
    );
    expect(sections).toEqual(
      new Set(['identity', 'colors', 'contact', 'social', 'legal', 'seo']),
    );
  });

  it('files every security key under the section its FIELD declares', () => {
    const sections = SETTING_DESCRIPTORS.filter(
      (d) => d.group === SECURITY_GROUP,
    ).map((d) => d.section);
    // Two sections since P8.10.B2. Order matters — it is the tab order the admin sees.
    expect([...new Set(sections)]).toEqual(['rateLimit', 'leads']);
    expect(keysIn(SECURITY_GROUP).length).toBe(EDITABLE_SECURITY_KEYS.length);
  });

  it('reads the section from the field, so a new one cannot land in the wrong tab', () => {
    const byKey = new Map(
      SETTING_DESCRIPTORS.filter((d) => d.group === SECURITY_GROUP).map((d) => [
        d.key,
        d.section,
      ]),
    );
    for (const field of SECURITY_FIELDS) {
      expect(byKey.get(field.key), field.key).toBe(field.section);
    }
  });

  it('hides the website art-direction / CMS-owned leaves (they would be dead controls)', () => {
    const shown = new Set(keysIn(BRANDING_GROUP));
    // Per-page color lives in the CMS pages settings; surfaces/text are the website's fixed
    // theme; fonts can't be runtime-swapped by name; nothing renders shortDesc.
    expect(shown.has('branding.colors.pageAccents.landing.accent')).toBe(false);
    expect(shown.has('branding.colors.surface.bg')).toBe(false);
    expect(shown.has('branding.colors.text.base')).toBe(false);
    expect(shown.has('branding.fonts.sans')).toBe(false);
    expect(shown.has('branding.brand.shortDesc')).toBe(false);
  });

  it('files every tracking key under the section its FIELD declares', () => {
    const sections = SETTING_DESCRIPTORS.filter(
      (d) => d.group === TRACKING_GROUP,
    ).map((d) => d.section);
    expect([...new Set(sections)]).toEqual(['consent', 'destinations']);
    expect(keysIn(TRACKING_GROUP).length).toBe(EDITABLE_TRACKING_KEYS.length);
  });

  /**
   * The descriptor is what the WRITER consults, so a pattern that stops at the field list
   * would validate nothing at all — the id would be accepted, and the destination would fail
   * silently for as long as the campaign ran.
   */
  it('carries the destination id pattern + example through to the descriptor', () => {
    const key = trackingDestinationSettingKeys('ga4').id;
    const descriptor = descriptorFor(key);
    expect(descriptor?.pattern).toBe('^G-[A-Z0-9]{4,20}$');
    expect(descriptor?.patternExample).toBe('G-ABCDE12345');
  });

  it('carries the bounds of a tracking number field too', () => {
    const descriptor = descriptorFor('tracking.consent.rememberDays');
    expect(descriptor?.min).toBe(1);
    expect(descriptor?.max).toBe(730);
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
