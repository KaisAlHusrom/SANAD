import type { LocalizedText } from '../common/localized-text.js';

/**
 * The fully-resolved branding / visual-identity record the gateway returns for the
 * website + admin (settings group `branding`). Every leaf is ALWAYS present — the
 * resolver fills any unset value from the coded default (U9), so reads are null-safe
 * to the leaf (F7). Pure response shape → `.types` file (U16). `string | null` leaves
 * (logo, social, contact) are "set or explicitly unset", never `undefined`.
 */
export interface BrandingRecord {
  brand: {
    name: LocalizedText;
    tagline: LocalizedText;
    shortDesc: LocalizedText;
  };
  logoUrl: string | null;
  faviconUrl: string | null;
  colors: BrandingColors;
  fonts: {
    sans: string;
    mono: string;
  };
  social: BrandingSocial;
  contact: BrandingContact;
}

/** A single page's accent triplet (the website's per-page art direction). */
export interface PageAccent {
  accent: string;
  secondary: string;
  ink: string;
}

export interface BrandingColors {
  /** The primary brand color (the landing accent). */
  primary: string;
  /** The secondary brand color. */
  secondary: string;
  /** Per-page accent map (landing/about/services/serviceDetail). */
  pageAccents: {
    landing: PageAccent;
    about: PageAccent;
    services: PageAccent;
    serviceDetail: PageAccent;
  };
  /** Website surface ladder. */
  surface: {
    bg: string;
    track: string;
    s1: string;
    s2: string;
  };
  /** Website text colors. */
  text: {
    base: string;
    dim: string;
    muted: string;
    faint: string;
  };
}

export interface BrandingSocial {
  twitter: string | null;
  linkedin: string | null;
  instagram: string | null;
  github: string | null;
  youtube: string | null;
}

export interface BrandingContact {
  email: string | null;
  phone: string | null;
  address: LocalizedText | null;
}
