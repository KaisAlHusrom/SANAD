import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createAppStore } from '../../../data/store/store';
import { useLeadsList } from './use-leads-list';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof Request) return input.url;
  return input.toString();
}

let lastUrl = '';

function wrapper(route: string) {
  const store = createAppStore();
  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
      </Provider>
    );
  };
}

beforeEach(() => {
  lastUrl = '';
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: RequestInfo | URL) => {
      lastUrl = urlOf(input);
      return Promise.resolve(
        jsonResponse({
          success: true,
          message: 'ok',
          data: {
            items: [],
            meta: { page: 1, pageSize: 20, total: 0, totalPages: 0 },
          },
        }),
      );
    }),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useLeadsList', () => {
  it('requests /leads newest-first by default', async () => {
    renderHook(() => useLeadsList(), { wrapper: wrapper('/leads') });
    await waitFor(() => expect(lastUrl).toContain('/leads'));
    expect(lastUrl).toContain('sort=createdAt');
    expect(lastUrl).toContain('order=desc');
  });

  it('passes a whitelisted status filter through', async () => {
    renderHook(() => useLeadsList(), {
      wrapper: wrapper('/leads?status=contacted'),
    });
    await waitFor(() => expect(lastUrl).toContain('status=contacted'));
  });

  it('drops an invalid status filter (N7)', async () => {
    renderHook(() => useLeadsList(), {
      wrapper: wrapper('/leads?status=bogus'),
    });
    await waitFor(() => expect(lastUrl).toContain('/leads'));
    expect(lastUrl).not.toContain('status=bogus');
  });
});
