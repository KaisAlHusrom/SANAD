import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthUser, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { UsersPage } from './users-page';

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

function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  if (input instanceof Request) return input.method;
  return init?.method ?? 'GET';
}

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

const user: AuthUser = {
  id: 'u1',
  email: 'sara@sanad.tech',
  name: 'Sara Ali',
  roles: ['admin'],
  isActive: true,
};

const fetchMock = vi.fn();

function stub(users: AuthUser[]): void {
  fetchMock.mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit) => {
      if (methodOf(input, init) === 'PATCH') {
        return Promise.resolve(
          jsonResponse({
            success: true,
            message: 'ok',
            data: { ...user, isActive: false },
          }),
        );
      }
      return Promise.resolve(
        jsonResponse({
          success: true,
          message: 'ok',
          data: {
            items: users,
            meta: {
              page: 1,
              pageSize: 20,
              total: users.length,
              totalPages: users.length ? 1 : 0,
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

describe('UsersPage', () => {
  it('renders a user row with name, email and role badge', async () => {
    stub([user]);
    renderWithProviders(<UsersPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('Sara Ali')).toBeInTheDocument();
    expect(screen.getByText('sara@sanad.tech')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('shows the invite control for a manager', async () => {
    stub([user]);
    renderWithProviders(<UsersPage />, { store: storeWith(['manage']) });
    expect(
      await screen.findByRole('button', { name: 'Invite member' }),
    ).toBeInTheDocument();
  });

  it('hides the invite control and status switch for a read-only user', async () => {
    stub([user]);
    renderWithProviders(<UsersPage />, {
      store: storeWith(['identity.users.read'], ['developer']),
    });
    expect(await screen.findByText('Sara Ali')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Invite member' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('switch', { name: 'Toggle active' }),
    ).not.toBeInTheDocument();
  });

  it('toggles active state via the inline switch (manager)', async () => {
    const u = userEvent.setup();
    stub([user]);
    renderWithProviders(<UsersPage />, { store: storeWith(['manage']) });
    await screen.findByText('Sara Ali');

    await u.click(screen.getByRole('switch', { name: 'Toggle active' }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            urlOf(input as RequestInfo | URL).includes('/identity/users/u1') &&
            methodOf(input as RequestInfo | URL, init as RequestInit) ===
              'PATCH',
        ),
      ).toBe(true);
    });
  });
});
