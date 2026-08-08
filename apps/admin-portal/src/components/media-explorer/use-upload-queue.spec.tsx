import type { UploadSignResult } from '@sanad/contracts';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../data/store/register-apis';
import { createAppStore } from '../../data/store/store';
import { toastStore } from '../../data/toast/toast-store';
import { i18n } from '../../i18n';
import { stubR2Upload } from '../../test';
import { useUploadQueue } from './use-upload-queue';

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
    filename: 'x.png',
    mimeType: 'image/png',
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
    headers: { 'content-type': 'image/png' },
    expiresAt: 'x',
  },
};

/** The gateway answers sign + confirm; the R2 PUT is stubbed separately (it's an XHR). */
function stubGateway() {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: Request | string) => {
      const url = typeof input === 'string' ? input : input.url;
      if (url.includes('/confirm')) {
        return Promise.resolve(
          jsonResponse({
            success: true,
            message: 'ok',
            data: { ...signResult.asset, status: 'ready' },
          }),
        );
      }
      return Promise.resolve(
        jsonResponse({ success: true, message: 'ok', data: signResult }),
      );
    }),
  );
}

/**
 * Deliberately a PDF, not an image: the confirm leg reads an image's natural dimensions through
 * an `<img>`, and jsdom never fires load/error for a blob URL — so an image file would hang the
 * queue in the test environment only. Non-images skip that read and exercise the same queue.
 */
function makeFile(name: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, {
    type: 'application/pdf',
  });
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  toastStore.reset();
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useUploadQueue — every file has a visible life (U23)', () => {
  it('starts empty and idle', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: makeWrapper(),
    });
    expect(result.current.items).toEqual([]);
    expect(result.current.isUploading).toBe(false);
  });

  it('takes a whole drop and finishes every file', async () => {
    stubGateway();
    stubR2Upload();
    const uploaded: string[] = [];
    const { result } = renderHook(
      () => useUploadQueue({ onUploaded: (asset) => uploaded.push(asset.id) }),
      { wrapper: makeWrapper() },
    );

    act(() => {
      result.current.enqueue([makeFile('a.pdf'), makeFile('b.pdf')], null);
    });

    await waitFor(() => expect(result.current.doneCount).toBe(2));
    expect(result.current.isUploading).toBe(false);
    expect(result.current.items.map((item) => item.name)).toEqual([
      'a.pdf',
      'b.pdf',
    ]);
    expect(result.current.items.every((item) => item.progress === 1)).toBe(
      true,
    );
    expect(uploaded).toHaveLength(2);
  });

  it('remembers the destination folder each file was dropped into', async () => {
    stubGateway();
    stubR2Upload();
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: makeWrapper(),
    });

    act(() => result.current.enqueue([makeFile('a.pdf')], 'brand'));
    await waitFor(() => expect(result.current.doneCount).toBe(1));
    expect(result.current.items[0]?.folderId).toBe('brand');
  });

  /**
   * The owner's report, at the level of one file in a batch: a failure must NAME its cause and
   * leave a way forward, never disappear.
   */
  it('marks a blocked upload as failed, names the CORS cause, and offers no false retry', async () => {
    stubGateway();
    stubR2Upload({ blocked: true });
    vi.stubGlobal('navigator', { onLine: true });
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: makeWrapper(),
    });

    act(() => result.current.enqueue([makeFile('a.pdf')], null));

    await waitFor(() => expect(result.current.failedCount).toBe(1));
    const item = result.current.items[0];
    expect(item?.status).toBe('failed');
    expect(item?.error).toMatch(/blocking uploads/i);
    // retrying the same bytes cannot fix a bucket policy — so no retry is offered
    expect(item?.retryable).toBe(false);
  });

  it('offers a retry for a failure that could plausibly pass next time, and it succeeds', async () => {
    stubGateway();
    stubR2Upload({ status: 500 });
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: makeWrapper(),
    });

    act(() => result.current.enqueue([makeFile('a.pdf')], null));
    await waitFor(() => expect(result.current.failedCount).toBe(1));
    expect(result.current.items[0]?.retryable).toBe(true);

    // storage recovers…
    stubR2Upload();
    const failedId = result.current.items[0]?.id as string;
    act(() => result.current.retry(failedId));

    await waitFor(() => expect(result.current.doneCount).toBe(1));
    expect(result.current.failedCount).toBe(0);
  });

  it('retryAll re-queues every failure at once', async () => {
    stubGateway();
    stubR2Upload({ status: 500 });
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: makeWrapper(),
    });

    act(() =>
      result.current.enqueue([makeFile('a.pdf'), makeFile('b.pdf')], null),
    );
    await waitFor(() => expect(result.current.failedCount).toBe(2));

    stubR2Upload();
    act(() => result.current.retryAll());
    await waitFor(() => expect(result.current.doneCount).toBe(2));
  });

  it('announces the batch ONCE, not once per file', async () => {
    stubGateway();
    stubR2Upload();
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: makeWrapper(),
    });

    act(() => {
      result.current.enqueue(
        [makeFile('a.pdf'), makeFile('b.pdf'), makeFile('c.pdf')],
        null,
      );
    });
    await waitFor(() => expect(result.current.doneCount).toBe(3));

    const toasts = toastStore.getSnapshot();
    expect(toasts).toHaveLength(1);
    expect(toasts[0]?.variant).toBe('success');
    expect(toasts[0]?.title).toMatch(/3/);
  });

  it('dismisses one row and clears the finished ones', async () => {
    stubGateway();
    stubR2Upload();
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: makeWrapper(),
    });

    act(() =>
      result.current.enqueue([makeFile('a.pdf'), makeFile('b.pdf')], null),
    );
    await waitFor(() => expect(result.current.doneCount).toBe(2));

    act(() => result.current.dismiss(result.current.items[0]?.id as string));
    expect(result.current.items).toHaveLength(1);

    act(() => result.current.clearFinished());
    expect(result.current.items).toHaveLength(0);
  });

  it('ignores an empty drop rather than showing an empty tray', () => {
    const { result } = renderHook(() => useUploadQueue(), {
      wrapper: makeWrapper(),
    });
    act(() => result.current.enqueue([], null));
    expect(result.current.items).toEqual([]);
  });
});
