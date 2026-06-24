import { describe, expect, it } from 'vitest';
import { assembleBranding } from './branding.assembler.js';
import { BRANDING_DEFAULTS } from './branding-catalog.js';

describe('assembleBranding', () => {
  it('returns the full coded defaults when nothing is resolved (the P3 acceptance)', () => {
    expect(assembleBranding({})).toEqual(BRANDING_DEFAULTS);
  });

  it('deep-merges resolved values over defaults, leaving other leaves intact', () => {
    const record = assembleBranding({
      'branding.colors.primary': '#ff0000',
      'branding.brand.name': { ar: 'مخصص', en: 'Custom' },
      'branding.contact.email': 'hi@sanad.tech',
    });
    expect(record.colors.primary).toBe('#ff0000');
    expect(record.brand.name).toEqual({ ar: 'مخصص', en: 'Custom' });
    expect(record.contact.email).toBe('hi@sanad.tech');
    // untouched leaves keep their defaults
    expect(record.colors.secondary).toBe(BRANDING_DEFAULTS.colors.secondary);
    expect(record.brand.tagline).toEqual(BRANDING_DEFAULTS.brand.tagline);
  });

  it('produces a record whose every leaf is defined (F7 null-safety)', () => {
    const record = assembleBranding({});
    expect(record.colors.pageAccents.serviceDetail.ink).toBeTypeOf('string');
    expect(record.fonts.mono).toBeTypeOf('string');
    expect(record.brand.shortDesc.ar.length).toBeGreaterThan(0);
  });

  it('does not mutate BRANDING_DEFAULTS', () => {
    assembleBranding({ 'branding.colors.primary': '#000000' });
    expect(BRANDING_DEFAULTS.colors.primary).not.toBe('#000000');
  });
});
