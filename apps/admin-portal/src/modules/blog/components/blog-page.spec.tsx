import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { BlogPostItem, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { toastStore } from '../../../data/toast';
import '../i18n';
import { BlogPage } from './blog-page';

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

const post: BlogPostItem = {
  id: 'b1',
  slug: 'hello-world',
  category: { id: 'c1', slug: 'eng', name: { ar: 'هندسة', en: 'Engineering' } },
  author: { id: 'a1', slug: 'sara', name: { ar: 'سارة', en: 'Sara' } },
  tags: [],
  coverMediaId: null,
  status: 'draft',
  publishedAt: null,
  readMinutes: null,
  sortOrder: 0,
  title: { ar: 'مرحبا', en: 'Hello world' },
  excerpt: { ar: '', en: '' },
  body: { ar: '', en: '' },
  createdAt: 'x',
  updatedAt: '2026-06-28T10:00:00.000Z',
};

function stubList(items: BlogPostItem[]): void {
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

describe('BlogPage', () => {
  it('renders rows, the create control and both taxonomy links for content.manage', async () => {
    stubList([post]);
    renderWithProviders(<BlogPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('Hello world')).toBeInTheDocument();
    expect(screen.getByText('Engineering')).toBeInTheDocument();
    expect(screen.getByText('Sara')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New post' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Manage categories' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'Manage tags' }),
    ).toBeInTheDocument();
  });

  it('hides the create control for a read-only user', async () => {
    stubList([post]);
    renderWithProviders(<BlogPage />, {
      store: storeWith(['content.read'], ['developer']),
    });
    expect(await screen.findByText('Hello world')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'New post' }),
    ).not.toBeInTheDocument();
  });

  it('PATCHes a partial { status } body when the status Switch is toggled (W6)', async () => {
    const patched: Array<Record<string, unknown>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: Request) => {
        if (input.method === 'PATCH') {
          patched.push((await input.clone().json()) as Record<string, unknown>);
          return jsonResponse({
            success: true,
            message: 'ok',
            data: { ...post, status: 'published' },
          });
        }
        return jsonResponse({
          success: true,
          message: 'ok',
          data: {
            items: [post],
            meta: { page: 1, pageSize: 20, total: 1, totalPages: 1 },
          },
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(<BlogPage />, { store: storeWith(['manage']) });

    await screen.findByText('Hello world');
    await user.click(screen.getByRole('switch', { name: 'Status' }));

    await waitFor(() => expect(patched).toHaveLength(1));
    expect(patched[0]).toEqual({ status: 'published' });
  });
});
