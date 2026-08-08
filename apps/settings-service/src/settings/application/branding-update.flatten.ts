import type { BrandingUpdateRequest, SettingType } from '@sanad/contracts';
import type { ResolvedValue } from './resolved-value.js';

/** One flat write derived from a branding-update body: the catalog key, type, value. */
export interface BrandingWrite {
  key: string;
  type: SettingType;
  value: ResolvedValue;
}

const PAGE_KEYS = ['landing', 'about', 'services', 'serviceDetail'] as const;

/**
 * Flatten a deep-partial branding update into per-key writes (keys match
 * `BRANDING_FIELDS`). Only **present** leaves produce a write — an absent field is
 * left untouched (falls through to global/coded default), while an explicit `null`
 * clears the value (U9). Distinguishes the two via `value !== undefined`.
 */
export function flattenBrandingUpdate(
  body: BrandingUpdateRequest,
): BrandingWrite[] {
  const writes: BrandingWrite[] = [];
  const add = (
    key: string,
    type: SettingType,
    value: ResolvedValue | undefined,
  ): void => {
    if (value !== undefined) {
      writes.push({ key, type, value });
    }
  };

  if (body.brand) {
    add('branding.brand.name', 'localized_text', body.brand.name);
    add('branding.brand.tagline', 'localized_text', body.brand.tagline);
    add('branding.brand.shortDesc', 'localized_text', body.brand.shortDesc);
  }
  add('branding.logoUrl', 'image', body.logoUrl);
  add('branding.faviconUrl', 'image', body.faviconUrl);

  if (body.colors) {
    const colors = body.colors;
    add('branding.colors.primary', 'color', colors.primary);
    add('branding.colors.secondary', 'color', colors.secondary);
    if (colors.pageAccents) {
      for (const page of PAGE_KEYS) {
        const accent = colors.pageAccents[page];
        if (accent) {
          add(
            `branding.colors.pageAccents.${page}.accent`,
            'color',
            accent.accent,
          );
          add(
            `branding.colors.pageAccents.${page}.secondary`,
            'color',
            accent.secondary,
          );
          add(`branding.colors.pageAccents.${page}.ink`, 'color', accent.ink);
        }
      }
    }
    if (colors.surface) {
      add('branding.colors.surface.bg', 'color', colors.surface.bg);
      add('branding.colors.surface.track', 'color', colors.surface.track);
      add('branding.colors.surface.s1', 'color', colors.surface.s1);
      add('branding.colors.surface.s2', 'color', colors.surface.s2);
    }
    if (colors.text) {
      add('branding.colors.text.base', 'color', colors.text.base);
      add('branding.colors.text.dim', 'color', colors.text.dim);
      add('branding.colors.text.muted', 'color', colors.text.muted);
      add('branding.colors.text.faint', 'color', colors.text.faint);
    }
  }

  if (body.fonts) {
    add('branding.fonts.sans', 'text', body.fonts.sans);
    add('branding.fonts.mono', 'text', body.fonts.mono);
  }

  if (body.social) {
    add('branding.social.twitter', 'url', body.social.twitter);
    add('branding.social.linkedin', 'url', body.social.linkedin);
    add('branding.social.instagram', 'url', body.social.instagram);
    add('branding.social.github', 'url', body.social.github);
    add('branding.social.youtube', 'url', body.social.youtube);
  }

  if (body.contact) {
    add('branding.contact.email', 'text', body.contact.email);
    add('branding.contact.phone', 'text', body.contact.phone);
    add('branding.contact.address', 'localized_text', body.contact.address);
  }

  if (body.legal) {
    add('branding.legal.copyright', 'localized_text', body.legal.copyright);
  }

  if (body.seo) {
    add('branding.seo.siteUrl', 'url', body.seo.siteUrl);
    add('branding.seo.shareImageUrl', 'image', body.seo.shareImageUrl);
  }

  return writes;
}
