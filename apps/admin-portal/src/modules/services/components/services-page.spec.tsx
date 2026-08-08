import { screen } from '@testing-library/react';
import type { Role, ServiceItem } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { ServicesPage } from './services-page';

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

const service: ServiceItem = {
  id: 's1',
  slug: 'saas',
  iconKey: null,
  category: 'core',
  coverMediaId: null,
  sortOrder: 0,
  title: { ar: 'منصة', en: 'SaaS platform' },
  summary: { ar: '', en: '' },
  detailBody: { ar: '', en: '' },
  createdAt: 'x',
  updatedAt: '2026-06-26T10:00:00.000Z',
};

function stubList(items: ServiceItem[]): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() =>
      Promise.resolve(
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
      ),
    ),
  );
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('ServicesPage', () => {
  it('shows the empty state when there are no services', async () => {
    stubList([]);
    renderWithProviders(<ServicesPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('renders rows and the create control for content.manage', async () => {
    stubList([service]);
    renderWithProviders(<ServicesPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('SaaS platform')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New service' }),
    ).toBeInTheDocument();
  });

  it('hides the create control for a read-only user', async () => {
    stubList([service]);
    renderWithProviders(<ServicesPage />, {
      store: storeWith(['content.read'], ['developer']),
    });
    expect(await screen.findByText('SaaS platform')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New service' }),
    ).not.toBeInTheDocument();
  });
});
