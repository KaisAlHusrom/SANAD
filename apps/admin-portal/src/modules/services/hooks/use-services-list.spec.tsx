import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../data/store/register-apis';
import { createAppStore } from '../../../data/store/store';
import { useServicesList } from './use-services-list';

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
      <MemoryRouter>{children}</MemoryRouter>
    </Provider>
  );
}

const emptyPage = {
  items: [],
  meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useServicesList', () => {
  it('queries /content/services page 1 then sends the category filter', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: emptyPage }),
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useServicesList(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const firstUrl = (fetchMock.mock.calls[0]?.[0] as Request).url;
    expect(firstUrl).toContain('/content/services?');
    expect(firstUrl).toContain('page=1');

    act(() => result.current.list.setFilter('category', 'core'));

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => (call[0] as Request).url);
      expect(urls.some((url) => url.includes('category=core'))).toBe(true);
    });
  });
});
