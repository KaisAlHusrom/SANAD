import { waitFor } from '@testing-library/react';
import type { BrandingRecord } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '../../data/events/event-bus';
import { i18n } from '../../i18n';
import { renderWithProviders } from '../../test/render-with-providers';
import { PORTAL_BRAND_STYLE_ID } from '../../styles/portal-brand-css';
import { BrandingThemeProvider } from './branding-theme-provider';

function brandingRecord(primary: string): BrandingRecord {
  return {
    brand: {
      name: { ar: 'اسم', en: 'Acme' },
      tagline: { ar: '', en: '' },
      shortDesc: { ar: '', en: '' },
    },
    logoUrl: null,
    faviconUrl: 'https://cdn.test/favicon.png',
    colors: {
      primary,
      secondary: '#00ff00',
      pageAccents: {} as BrandingRecord['colors']['pageAccents'],
      surface: {} as BrandingRecord['colors']['surface'],
      text: {} as BrandingRecord['colors']['text'],
    },
    fonts: { sans: '', mono: '' },
    social: {
      twitter: null,
      linkedin: null,
      instagram: null,
      github: null,
      youtube: null,
    },
    contact: { email: null, phone: null, address: null },
    legal: { copyright: { ar: '', en: '' } },
    seo: { siteUrl: null, shareImageUrl: null },
  };
}

function envelope(primary: string): Response {
  return new Response(
    JSON.stringify({
      success: true,
      message: 'ok',
      data: brandingRecord(primary),
    }),
    { status: 200, headers: { 'content-type': 'application/json' } },
  );
}

function brandStyle(): string {
  return document.getElementById(PORTAL_BRAND_STYLE_ID)?.textContent ?? '';
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  document.getElementById(PORTAL_BRAND_STYLE_ID)?.remove();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BrandingThemeProvider (portal themes itself from settings)', () => {
  it('injects the brand accent, favicon and tab title from the record', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(envelope('#ff0000')));
    renderWithProviders(
      <BrandingThemeProvider>
        <div>app</div>
      </BrandingThemeProvider>,
    );

    await waitFor(() => expect(brandStyle()).toContain('--accent: #ff0000;'));
    expect(document.title).toBe('Acme');
    expect(
      document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href,
    ).toContain('favicon.png');
  });

  it('re-skins instantly when a settings save publishes settings.updated (W4)', async () => {
    let primary = '#ff0000';
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async () => envelope(primary)),
    );
    renderWithProviders(
      <BrandingThemeProvider>
        <div>app</div>
      </BrandingThemeProvider>,
    );
    await waitFor(() => expect(brandStyle()).toContain('--accent: #ff0000;'));

    // The owner saves a new primary in the settings module; the bus bridges it here.
    primary = '#0000ff';
    eventBus.publish({ type: 'settings.updated' });

    await waitFor(() => expect(brandStyle()).toContain('--accent: #0000ff;'));
  });
});
