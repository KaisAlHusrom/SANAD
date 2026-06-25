import { act, renderHook } from '@testing-library/react';
import type { UploadSignResult } from '@sanad/contracts';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../../data/store/register-apis';
import { eventBus } from '../../../data/events/event-bus';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import '../i18n';
import { useUpload } from './use-upload';

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

const signResult: UploadSignResult = {
  asset: {
    id: 'a1',
    folderId: null,
    key: 'media/a1',
    url: 'presigned',
    filename: 'x',
    mimeType: 'application/pdf',
    size: 3,
    width: null,
    height: null,
    status: 'pending',
    alt: { ar: '', en: '' },
    createdAt: 'x',
    updatedAt: 'x',
  },
  upload: {
    url: 'https://r2.example.com/put?sig=1',
    method: 'PUT',
    headers: { 'content-type': 'application/pdf' },
    expiresAt: 'x',
  },
};

const confirmedAsset = {
  ...signResult.asset,
  status: 'ready',
  url: 'https://cdn/x',
};

const pdf = new File([new Uint8Array([1, 2, 3])], 'x.pdf', {
  type: 'application/pdf',
});

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useUpload (presigned flow orchestration)', () => {
  it('runs sign → R2 PUT → confirm in order, omitting dims for a non-image, and publishes the event', async () => {
    const order: string[] = [];
    let confirmRequest: Request | undefined;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: Request | string) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('/confirm')) {
          order.push('confirm');
          if (typeof input !== 'string') confirmRequest = input.clone();
          return Promise.resolve(
            jsonResponse({
              success: true,
              message: 'ok',
              data: confirmedAsset,
            }),
          );
        }
        if (url.includes('r2.example.com')) {
          order.push('r2');
          return Promise.resolve(new Response(null, { status: 200 }));
        }
        order.push('sign');
        return Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: signResult }),
        );
      }),
    );
    const events: string[] = [];
    const unsubscribe = eventBus.subscribe((event) => events.push(event.type));
    const { result } = renderHook(() => useUpload(), {
      wrapper: makeWrapper(),
    });

    let returned: unknown;
    await act(async () => {
      returned = await result.current.upload(pdf);
    });
    unsubscribe();

    expect(order).toEqual(['sign', 'r2', 'confirm']);
    expect(returned).toEqual(confirmedAsset);
    expect(events).toContain('media.asset.uploaded');
    expect(result.current.status).toBe('done');
    // a non-image omits width/height (both optional) → empty confirm body
    await expect(confirmRequest?.json()).resolves.toEqual({});
  });

  it('stops and surfaces an error when the R2 PUT fails (confirm not called)', async () => {
    const order: string[] = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: Request | string) => {
        const url = typeof input === 'string' ? input : input.url;
        if (url.includes('r2.example.com')) {
          order.push('r2');
          return Promise.resolve(new Response(null, { status: 403 }));
        }
        order.push('sign');
        return Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: signResult }),
        );
      }),
    );
    const { result } = renderHook(() => useUpload(), {
      wrapper: makeWrapper(),
    });

    let returned: unknown;
    await act(async () => {
      returned = await result.current.upload(pdf);
    });

    expect(order).toEqual(['sign', 'r2']);
    expect(returned).toBeNull();
    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe('The upload failed.');
  });

  it('surfaces the storage-unconfigured message on a 503 sign', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse(
            { success: false, message: 'Media storage is not configured' },
            503,
          ),
        ),
    );
    const { result } = renderHook(() => useUpload(), {
      wrapper: makeWrapper(),
    });

    await act(async () => {
      await result.current.upload(pdf);
    });

    expect(result.current.status).toBe('error');
    expect(result.current.error).toBe("Media storage isn't configured yet.");
  });
});
