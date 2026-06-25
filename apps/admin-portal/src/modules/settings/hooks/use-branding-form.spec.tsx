import { act, renderHook } from '@testing-library/react';
import type { BrandingRecord } from '@sanad/contracts';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../../data/store/register-apis';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import '../i18n';
import { useBrandingForm } from './use-branding-form';

const record: BrandingRecord = {
  brand: {
    name: { ar: 'سند', en: 'Sanad' },
    tagline: { ar: 'ثقة', en: 'Trust' },
    shortDesc: { ar: 'وصف', en: 'Desc' },
  },
  logoUrl: 'https://cdn.example.com/logo.png',
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
    linkedin: null,
    instagram: null,
    github: null,
    youtube: null,
  },
  contact: { email: 'hi@sanad.tech', phone: null, address: null },
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function makeWrapper() {
  const store = createAppStore();
  return ({ children }: { children: ReactNode }) => (
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
    </Provider>
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useBrandingForm', () => {
  it('is not dirty on prefill (F6)', () => {
    vi.stubGlobal('fetch', vi.fn());
    const { result } = renderHook(() => useBrandingForm(record), {
      wrapper: makeWrapper(),
    });
    expect(result.current.isDirty).toBe(false);
  });

  it('PUTs only the changed leaf', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: record }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useBrandingForm(record), {
      wrapper: makeWrapper(),
    });

    act(() =>
      result.current.form.setValue('colors.primary', '#ff0000', {
        shouldDirty: true,
      }),
    );
    await act(async () => {
      await result.current.onSubmit();
    });

    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.method).toBe('PUT');
    await expect(request.clone().json()).resolves.toEqual({
      colors: { primary: '#ff0000' },
    });
  });

  it('does not PUT when nothing changed (empty diff is a no-op)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useBrandingForm(record), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.onSubmit();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('blocks submit on an invalid hex (no request)', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    const { result } = renderHook(() => useBrandingForm(record), {
      wrapper: makeWrapper(),
    });

    act(() =>
      result.current.form.setValue('colors.primary', 'not-a-hex', {
        shouldDirty: true,
        shouldValidate: true,
      }),
    );
    await act(async () => {
      await result.current.onSubmit();
    });

    expect(fetchMock).not.toHaveBeenCalled();
  });
});
