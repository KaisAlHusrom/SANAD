import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { AuthUser } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { USER_ROLES_MODAL, UserRolesModal } from './user-roles-modal';

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

const user: AuthUser = {
  id: 'u1',
  email: 'sara@sanad.tech',
  name: 'Sara Ali',
  roles: ['admin'],
  isActive: true,
};

const fetchMock = vi.fn();

function store() {
  const s = createAppStore();
  s.dispatch(
    identityLoaded({ userId: 'u', roles: ['admin'], permissions: ['manage'] }),
  );
  return s;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
  fetchMock.mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit) => {
      const method = methodOf(input, init);
      const roles = method === 'POST' ? ['admin', 'developer'] : ['admin'];
      return Promise.resolve(
        jsonResponse({
          success: true,
          message: 'ok',
          data: { ...user, roles },
        }),
      );
    },
  );
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('UserRolesModal', () => {
  it('marks the assigned role as pressed and assigns a new one on click', async () => {
    const u = userEvent.setup();
    renderWithProviders(
      <UserRolesModal
        open
        type={USER_ROLES_MODAL}
        onClose={() => undefined}
        data={{ user }}
      />,
      { store: store() },
    );

    expect(
      screen.getByRole('button', { name: 'Admin', pressed: true }),
    ).toBeInTheDocument();
    const developer = screen.getByRole('button', {
      name: 'Developer',
      pressed: false,
    });
    await u.click(developer);

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            urlOf(input as RequestInfo | URL).includes(
              '/identity/users/u1/roles',
            ) &&
            methodOf(input as RequestInfo | URL, init as RequestInit) ===
              'POST',
        ),
      ).toBe(true);
    });
  });

  it('revokes an assigned role on click (DELETE)', async () => {
    const u = userEvent.setup();
    renderWithProviders(
      <UserRolesModal
        open
        type={USER_ROLES_MODAL}
        onClose={() => undefined}
        data={{ user }}
      />,
      { store: store() },
    );

    await u.click(screen.getByRole('button', { name: 'Admin', pressed: true }));

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            urlOf(input as RequestInfo | URL).includes(
              '/identity/users/u1/roles/admin',
            ) &&
            methodOf(input as RequestInfo | URL, init as RequestInit) ===
              'DELETE',
        ),
      ).toBe(true);
    });
  });
});
