import { screen } from '@testing-library/react';
import type { BrandingRecord } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { BrandingPage } from '../index';

const record: BrandingRecord = {
  brand: {
    name: { ar: 'سند', en: 'Sanad' },
    tagline: { ar: 'ثقة', en: 'Trust' },
    shortDesc: { ar: 'وصف', en: 'Desc' },
  },
  logoUrl: null,
  faviconUrl: null,
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
    linkedin: null,
    instagram: null,
    github: null,
    youtube: null,
  },
  contact: { email: null, phone: null, address: null },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function storeWithManage() {
  const store = createAppStore();
  store.dispatch(
    identityLoaded({ userId: 'u', roles: ['admin'], permissions: ['manage'] }),
  );
  return store;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('BrandingPage (RenderGate)', () => {
  it('renders the editor from the resolved branding record', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ success: true, message: 'ok', data: record }),
        ),
    );
    renderWithProviders(<BrandingPage />, { store: storeWithManage() });

    expect(await screen.findByText('Primary color')).toBeInTheDocument();
    expect(screen.getByText('Visual identity')).toBeInTheDocument();
    expect(screen.getByText('Advanced color system')).toBeInTheDocument();
  });

  it('shows the error state when branding fails to load', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ success: false, message: 'no' }, 500),
        ),
    );
    renderWithProviders(<BrandingPage />, { store: storeWithManage() });

    expect(
      await screen.findByText("Couldn't load the visual identity."),
    ).toBeInTheDocument();
  });
});
