import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../data/store/register-apis';
import { createAppStore } from '../../../data/store/store';
import { useTeamList } from './use-team-list';

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

describe('useTeamList', () => {
  it('queries /content/team then sends the featured filter', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: emptyPage }),
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useTeamList(), {
      wrapper: makeWrapper(),
    });

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect((fetchMock.mock.calls[0]?.[0] as Request).url).toContain(
      '/content/team?',
    );

    act(() => result.current.list.setFilter('featured', 'true'));

    await waitFor(() => {
      const urls = fetchMock.mock.calls.map((call) => (call[0] as Request).url);
      expect(urls.some((url) => url.includes('featured=true'))).toBe(true);
    });
  });
});
