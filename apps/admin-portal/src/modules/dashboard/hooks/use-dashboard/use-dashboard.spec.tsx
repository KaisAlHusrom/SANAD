import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { Provider } from 'react-redux';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../../data/store/register-apis';
import { eventBus } from '../../../../data/events';
import { createAppStore } from '../../../../data/store/store';
import { useDashboard } from './use-dashboard';

const stats = {
  counts: {
    leadsTotal: 3,
    leadsNew: 1,
    users: 2,
    services: 5,
    blogPosts: 8,
    unreadNotifications: 0,
  },
  recentLeads: [],
  recentActivity: [],
};

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function makeWrapper() {
  const store = createAppStore();
  return ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useDashboard', () => {
  // Every event listed here moves a number the dashboard renders. `content.service.changed`
  // and `content.blog.changed` are the U27 half-wired pair: `DashboardCounts.services` and
  // `.blogPosts` are derived from those collections, so the tiles went stale on every edit.
  it.each([
    'lead.updated',
    'notification.read',
    'identity.user.changed',
    'content.service.changed',
    'content.blog.changed',
  ] as const)('refetches the stats when `%s` is published', async (type) => {
    const fetchMock = vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: stats }),
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    renderHook(() => useDashboard(), { wrapper: makeWrapper() });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));

    eventBus.publish({ type });

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
  });
});
