import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { toastStore } from '../../../data/toast';
import '../i18n';
import { BlogCategoryFormModal } from './blog-category-form-modal';

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

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  toastStore.reset();
  vi.unstubAllGlobals();
});

describe('BlogCategoryFormModal', () => {
  it('creates a category with the localized name (default locale required, en optional)', async () => {
    const posted: Array<Record<string, unknown>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: Request) => {
        if (input.method === 'POST') {
          posted.push((await input.clone().json()) as Record<string, unknown>);
        }
        return jsonResponse({
          success: true,
          message: 'ok',
          data: {
            id: 'c1',
            slug: 'eng',
            sortOrder: 0,
            name: { ar: 'هندسة', en: '' },
            description: { ar: '', en: '' },
            createdAt: 'x',
            updatedAt: 'x',
          },
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <BlogCategoryFormModal
        open
        onClose={vi.fn()}
        data={{}}
        type="content.blog-category.form"
      />,
      { store: storeWith(['manage']) },
    );

    await user.type(screen.getByLabelText('Slug'), 'eng');
    await user.type(screen.getByLabelText('Name'), 'هندسة');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      slug: 'eng',
      name: { ar: 'هندسة', en: '' },
      description: { ar: '', en: '' },
    });
  });
});
