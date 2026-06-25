import {
  brandingUpdateRequestSchema,
  type BrandingRecord,
} from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { diffBranding } from './diff-branding';
import { toFormValues } from './to-form-values';

const record: BrandingRecord = {
  brand: {
    name: { ar: 'سند', en: 'Sanad' },
    tagline: { ar: 'ثقة', en: 'Trust' },
    shortDesc: { ar: 'وصف', en: 'Desc' },
  },
  logoUrl: null,
  faviconUrl: 'https://cdn.example.com/fav.ico',
  colors: {
    primary: '#22d3ee',
    secondary: '#3b82f6',
    pageAccents: {
      landing: { accent: '#22d3ee', secondary: '#3b82f6', ink: '#05080d' },
      about: { accent: '#2dd4bf', secondary: '#3b82f6', ink: '#05080d' },
      services: { accent: '#38bdf8', secondary: '#3b82f6', ink: '#05080d' },
      serviceDetail: {
        accent: '#6366f1',
        secondary: '#3b82f6',
        ink: '#05080d',
      },
    },
    surface: { bg: '#05080d', track: '#0a0f14', s1: '#10151c', s2: '#161c24' },
    text: {
      base: '#eaf2f0',
      dim: '#9fb0ad',
      muted: '#7e928e',
      faint: '#56655f',
    },
  },
  fonts: { sans: 'IBM Plex Sans Arabic', mono: 'IBM Plex Mono' },
  social: {
    twitter: null,
    linkedin: 'https://linkedin.com/company/sanad',
    instagram: null,
    github: null,
    youtube: null,
  },
  contact: { email: 'hi@sanad.tech', phone: null, address: null },
};

describe('diffBranding', () => {
  it('returns {} when nothing changed (system prefill is not dirty, F6)', () => {
    expect(diffBranding(record, toFormValues(record))).toEqual({});
  });

  it('sends ONLY the changed leaf', () => {
    const values = toFormValues(record);
    values.colors.primary = '#ff0000';
    expect(diffBranding(record, values)).toEqual({
      colors: { primary: '#ff0000' },
    });
  });

  it('sends the whole LocalizedText when a single locale changes', () => {
    const values = toFormValues(record);
    values.brand.name.en = 'Sanad Tech';
    expect(diffBranding(record, values)).toEqual({
      brand: { name: { ar: 'سند', en: 'Sanad Tech' } },
    });
  });

  it('maps a cleared nullable url to null', () => {
    const values = toFormValues(record);
    values.faviconUrl = '';
    expect(diffBranding(record, values)).toEqual({ faviconUrl: null });
  });

  it('sets a previously-null url', () => {
    const values = toFormValues(record);
    values.logoUrl = 'https://cdn.example.com/logo.png';
    expect(diffBranding(record, values)).toEqual({
      logoUrl: 'https://cdn.example.com/logo.png',
    });
  });

  it('diffs a single deep nested accent leaf', () => {
    const values = toFormValues(record);
    values.colors.pageAccents.landing.accent = '#000000';
    expect(diffBranding(record, values)).toEqual({
      colors: { pageAccents: { landing: { accent: '#000000' } } },
    });
  });

  it('sets a previously-null address from both locales', () => {
    const values = toFormValues(record);
    values.contact.address = { ar: 'الرياض', en: 'Riyadh' };
    expect(diffBranding(record, values)).toEqual({
      contact: { address: { ar: 'الرياض', en: 'Riyadh' } },
    });
  });

  it('produces a schema-valid deep-partial across several sections (U16)', () => {
    const values = toFormValues(record);
    values.colors.primary = '#abc';
    values.brand.tagline.ar = 'دعم';
    values.social.twitter = 'https://twitter.com/sanad';
    values.fonts.sans = 'Cairo';
    const diff = diffBranding(record, values);
    expect(brandingUpdateRequestSchema.safeParse(diff).success).toBe(true);
    expect(diff).toEqual({
      colors: { primary: '#abc' },
      brand: { tagline: { ar: 'دعم', en: 'Trust' } },
      social: { twitter: 'https://twitter.com/sanad' },
      fonts: { sans: 'Cairo' },
    });
  });
});
