import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PortfolioProjectItem, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { toastStore } from '../../../data/toast';
import '../i18n';
import { PortfolioPage } from './portfolio-page';

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

const project: PortfolioProjectItem = {
  id: 'p1',
  slug: 'acme-app',
  category: null,
  coverMediaId: null,
  clientName: null,
  projectUrl: null,
  status: 'draft',
  publishedAt: null,
  featured: false,
  sortOrder: 0,
  title: { ar: 'تطبيق', en: 'Acme app' },
  summary: { ar: '', en: '' },
  challenge: { ar: '', en: '' },
  solution: { ar: '', en: '' },
  result: { ar: '', en: '' },
  createdAt: 'x',
  updatedAt: '2026-06-28T10:00:00.000Z',
};

function stubList(items: PortfolioProjectItem[]): void {
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

describe('PortfolioPage', () => {
  it('renders rows, the create control and the categories link for content.manage', async () => {
    stubList([project]);
    renderWithProviders(<PortfolioPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('Acme app')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New project' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Manage categories' }),
    ).toBeInTheDocument();
  });

  it('hides the create control for a read-only user', async () => {
    stubList([project]);
    renderWithProviders(<PortfolioPage />, {
      store: storeWith(['content.read'], ['developer']),
    });
    expect(await screen.findByText('Acme app')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New project' }),
    ).not.toBeInTheDocument();
  });

  it('PATCHes a partial body when the featured Switch is toggled (W6)', async () => {
    const patched: Array<Record<string, unknown>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: Request) => {
        if (input.method === 'PATCH') {
          patched.push((await input.clone().json()) as Record<string, unknown>);
          return jsonResponse({
            success: true,
            message: 'ok',
            data: { ...project, featured: true },
          });
        }
        return jsonResponse({
          success: true,
          message: 'ok',
          data: {
            items: [project],
            meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
          },
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<PortfolioPage />, { store: storeWith(['manage']) });

    await screen.findByText('Acme app');
    await user.click(screen.getByRole('switch', { name: 'Featured' }));

    await waitFor(() => expect(patched).toHaveLength(1));
    expect(patched[0]).toEqual({ featured: true });
  });
});
