import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Notification, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { NotificationsBell } from './notifications-bell';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

const notification: Notification = {
  id: 'n1',
  channel: 'in_app',
  type: 'lead.created',
  payload: {
    leadId: 'l1',
    name: 'Layla',
    email: 'layla@example.com',
    phone: '+966501234567',
    company: null,
    projectType: null,
    message: 'Need a platform',
    source: 'contact',
    locale: 'ar',
  },
  readAt: null,
  createdAt: '2026-06-30T10:00:00.000Z',
};

const fetchMock = vi.fn();

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof Request) return input.url;
  return input.toString();
}

function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  if (input instanceof Request) return input.method;
  return init?.method ?? 'GET';
}

/** Stub the bell's two GETs (unread probe + recent list) and the mark-read PATCH. */
function stub(unreadTotal: number, items: Notification[]): void {
  fetchMock.mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const url = urlOf(input);
      if (methodOf(input, init) === 'PATCH') {
        return Promise.resolve(
          jsonResponse({
            success: true,
            message: 'ok',
            data: { ...notification, readAt: '2026-06-30T11:00:00.000Z' },
          }),
        );
      }
      const isUnreadProbe = url.includes('unread=true');
      return Promise.resolve(
        jsonResponse({
          success: true,
          message: 'ok',
          data: {
            items: isUnreadProbe ? [] : items,
            meta: {
              page: 1,
              pageSize: isUnreadProbe ? 1 : 10,
              total: isUnreadProbe ? unreadTotal : items.length,
              totalPages: 1,
            },
          },
        }),
      );
    },
  );
  vi.stubGlobal('fetch', fetchMock);
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('NotificationsBell', () => {
  it('renders nothing without the notification.read permission', () => {
    stub(0, []);
    renderWithProviders(<NotificationsBell />, {
      store: storeWith(['content.read'], ['developer']),
    });
    expect(
      screen.queryByRole('button', { name: 'Notifications' }),
    ).not.toBeInTheDocument();
  });

  it('shows the unread count badge when there are unread notices', async () => {
    stub(3, [notification]);
    renderWithProviders(<NotificationsBell />, {
      store: storeWith(['manage']),
    });
    expect(await screen.findByText('3')).toBeInTheDocument();
  });

  it('hides the badge when there are no unread notices', async () => {
    stub(0, []);
    renderWithProviders(<NotificationsBell />, {
      store: storeWith(['manage']),
    });
    expect(
      await screen.findByRole('button', { name: 'Notifications' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('opens the dropdown and marks a notice read on click', async () => {
    const user = userEvent.setup();
    stub(1, [notification]);
    renderWithProviders(<NotificationsBell />, {
      store: storeWith(['manage']),
    });

    await user.click(
      await screen.findByRole('button', { name: 'Notifications' }),
    );
    const item = await screen.findByText('New lead from Layla');
    await user.click(item);

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            urlOf(input as RequestInfo | URL).includes(
              '/notifications/n1/read',
            ) &&
            methodOf(input as RequestInfo | URL, init as RequestInit) ===
              'PATCH',
        ),
      ).toBe(true);
    });
  });
});
