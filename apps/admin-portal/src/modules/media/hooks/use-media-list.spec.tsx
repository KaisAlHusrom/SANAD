import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../data/store/register-apis';
import { createAppStore } from '../../../data/store/store';
import { useMediaList } from './use-media-list';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function makeWrapper() {
  const store = createAppStore();
  return ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
}

const emptyPage = {
  items: [],
  meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useMediaList', () => {
  it('queries page 1 initially and sends the type filter when changed', async () => {
    // fresh Response per call — the same Response can't be cloned/consumed twice
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: emptyPage }),
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useMediaList(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const firstUrl = (fetchMock.mock.calls[0]?.[0] as Request).url;
    expect(firstUrl).toContain('/media?');
    expect(firstUrl).toContain('page=1');

    act(() => result.current.setType('image'));

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => (call[0] as Request).url);
      expect(urls.some((url) => url.includes('type=image'))).toBe(true);
    });
  });
});
