import { screen } from '@testing-library/react';
import type { BlogTagItem, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { BlogTagsPage } from './blog-tags-page';

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

const tag: BlogTagItem = {
  id: 'tag-1',
  slug: 'react',
  sortOrder: 0,
  name: { ar: 'رياكت', en: 'React' },
  createdAt: 'x',
  updatedAt: 'x',
};

function stubList(items: BlogTagItem[]): void {
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

describe('BlogTagsPage', () => {
  it('renders tags, the create control and the back link for content.manage', async () => {
    stubList([tag]);
    renderWithProviders(<BlogTagsPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('React')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'New tag' })).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Back to posts' }),
    ).toBeInTheDocument();
  });

  it('hides the create control for a read-only user', async () => {
    stubList([tag]);
    renderWithProviders(<BlogTagsPage />, {
      store: storeWith(['content.read'], ['developer']),
    });
    expect(await screen.findByText('React')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New tag' }),
    ).not.toBeInTheDocument();
  });
});
