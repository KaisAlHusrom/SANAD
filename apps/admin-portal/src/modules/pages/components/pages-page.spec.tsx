import { screen } from '@testing-library/react';
import type { PageSummary, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { toastStore } from '../../../data/toast';
import '../i18n';
import { PagesPage } from './pages-page';

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

const page: PageSummary = {
  id: 'pg1',
  slug: 'landing',
  status: 'published',
  sortOrder: 0,
  title: { ar: 'الرئيسية', en: 'Landing' },
  createdAt: 'x',
  updatedAt: '2026-06-28T10:00:00.000Z',
};

function stubList(items: PageSummary[]): void {
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
  toastStore.reset();
  vi.unstubAllGlobals();
});

describe('PagesPage', () => {
  it('renders the page rows + create control for content.manage', async () => {
    stubList([page]);
    renderWithProviders(<PagesPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('Landing')).toBeInTheDocument();
    expect(screen.getByText('/landing')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New page' }),
    ).toBeInTheDocument();
  });

  it('hides the create control for a read-only user', async () => {
    stubList([page]);
    renderWithProviders(<PagesPage />, {
      store: storeWith(['content.read'], ['developer']),
    });
    expect(await screen.findByText('Landing')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New page' }),
    ).not.toBeInTheDocument();
  });
});
