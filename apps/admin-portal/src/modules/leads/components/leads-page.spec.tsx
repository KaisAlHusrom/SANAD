import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Lead, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { selectOption } from '../../../test/select-option';
import '../i18n';
import { LeadsPage } from './leads-page';

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

const lead: Lead = {
  id: 'l1',
  name: 'Layla Hassan',
  email: 'layla@example.com',
  company: 'Acme',
  budget: null,
  projectType: 'SaaS',
  message: 'We need a platform',
  source: 'contact',
  locale: 'ar',
  status: 'new',
  createdAt: '2026-06-30T10:00:00.000Z',
  updatedAt: '2026-06-30T10:00:00.000Z',
};

const fetchMock = vi.fn();

function stub(items: Lead[]): void {
  fetchMock.mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit) => {
      if (methodOf(input, init) === 'PATCH') {
        return Promise.resolve(
          jsonResponse({
            success: true,
            message: 'ok',
            data: { ...lead, status: 'contacted' },
          }),
        );
      }
      return Promise.resolve(
        jsonResponse({
          success: true,
          message: 'ok',
          data: {
            items,
            meta: {
              page: 1,
              pageSize: 20,
              total: items.length,
              totalPages: items.length ? 1 : 0,
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

describe('LeadsPage', () => {
  it('shows the empty state when there are no leads', async () => {
    stub([]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('renders a lead row with name and email', async () => {
    stub([lead]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('Layla Hassan')).toBeInTheDocument();
    expect(screen.getByText('layla@example.com')).toBeInTheDocument();
  });

  it('changes a lead status via the inline select (manager)', async () => {
    const user = userEvent.setup();
    stub([lead]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    await screen.findByText('Layla Hassan');

    await selectOption(user, 'Change status', 'Contacted');

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            urlOf(input as RequestInfo | URL).includes('/leads/l1') &&
            methodOf(input as RequestInfo | URL, init as RequestInit) ===
              'PATCH',
        ),
      ).toBe(true);
    });
  });

  it('shows a read-only status badge without content.manage', async () => {
    stub([lead]);
    renderWithProviders(<LeadsPage />, {
      store: storeWith(['content.read'], ['developer']),
    });
    expect(await screen.findByText('Layla Hassan')).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: 'Change status' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });
});
