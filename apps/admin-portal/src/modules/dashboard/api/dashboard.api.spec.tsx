import { renderHook, waitFor } from '@testing-library/react';
import type { DashboardStats } from '@sanad/contracts';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { eventBus } from '../../../data/events/event-bus';
import { createAppStore } from '../../../data/store/store';
import { useDashboard } from '../hooks/use-dashboard';

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

const stats: DashboardStats = {
  counts: {
    leadsTotal: 10,
    leadsNew: 4,
    users: 5,
    services: 7,
    blogPosts: 3,
    unreadNotifications: 2,
  },
  recentLeads: [],
  recentActivity: [],
};

const fetchMock = vi.fn();
let calls = 0;

function wrapper() {
  const store = createAppStore();
  return function Wrapper({ children }: { children: ReactNode }) {
    return <Provider store={store}>{children}</Provider>;
  };
}

beforeEach(() => {
  calls = 0;
  fetchMock.mockImplementation((input: RequestInfo | URL) => {
    if (urlOf(input).includes('/dashboard/stats')) calls += 1;
    return Promise.resolve(
      jsonResponse({ success: true, message: 'ok', data: stats }),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useDashboard', () => {
  it('reads GET /dashboard/stats', async () => {
    const { result } = renderHook(() => useDashboard(), { wrapper: wrapper() });
    await waitFor(() => expect(result.current.stats).toBeDefined());
    expect(result.current.stats?.counts.leadsNew).toBe(4);
    expect(calls).toBeGreaterThanOrEqual(1);
  });

  it('refetches when a lead.updated event fires (W4)', async () => {
    renderHook(() => useDashboard(), { wrapper: wrapper() });
    await waitFor(() => expect(calls).toBe(1));

    eventBus.publish({ type: 'lead.updated' });

    await waitFor(() => expect(calls).toBe(2));
  });
});
