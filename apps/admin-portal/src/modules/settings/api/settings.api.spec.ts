import { configureStore } from '@reduxjs/toolkit';
import type { BrandingRecord } from '@sanad/contracts';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { authReducer } from '../../../data/auth/auth.slice';
import { eventBus } from '../../../data/events/event-bus';
import { settingsApi } from './settings.api';

function makeStore() {
  return configureStore({
    reducer: {
      auth: authReducer,
      [settingsApi.reducerPath]: settingsApi.reducer,
    },
    middleware: (getDefault) => getDefault().concat(settingsApi.middleware),
  });
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

const minimalRecord = {
  brand: { name: { ar: 'سند', en: 'Sanad' } },
} as BrandingRecord;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('settingsApi', () => {
  it('reads the branding record (GET /branding, envelope unwrapped)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: minimalRecord }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();

    const data = await store
      .dispatch(settingsApi.endpoints.getBranding.initiate())
      .unwrap();

    expect(data).toEqual(minimalRecord);
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.url).toContain('/branding');
    expect(request.method).toBe('GET');
  });

  it('PUTs a deep-partial update and publishes settings.branding.updated (W4)', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: minimalRecord }),
      );
    vi.stubGlobal('fetch', fetchMock);
    const store = makeStore();
    const events: string[] = [];
    const unsubscribe = eventBus.subscribe((event) => events.push(event.type));

    await store
      .dispatch(
        settingsApi.endpoints.updateBranding.initiate({
          colors: { primary: '#ff0000' },
        }),
      )
      .unwrap();
    unsubscribe();

    expect(events).toContain('settings.branding.updated');
    const request = fetchMock.mock.calls[0]?.[0] as Request;
    expect(request.method).toBe('PUT');
    await expect(request.clone().json()).resolves.toEqual({
      colors: { primary: '#ff0000' },
    });
  });
});
