import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PortfolioCategoryItem, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { toastStore } from '../../../data/toast';
import '../i18n';
import { PortfolioCategoryFormModal } from './portfolio-category-form-modal';

function jsonResponse(body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });
}

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

const category: PortfolioCategoryItem = {
  id: 'cat-1',
  slug: 'web',
  sortOrder: 0,
  name: { ar: 'الويب', en: 'Web' },
  createdAt: 'x',
  updatedAt: 'x',
};

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  toastStore.reset();
  vi.unstubAllGlobals();
});

describe('PortfolioCategoryFormModal', () => {
  it('creates a category with the pivoted, localized name body', async () => {
    const posted: Array<Record<string, unknown>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: Request) => {
        if (input.method === 'POST') {
          posted.push((await input.clone().json()) as Record<string, unknown>);
        }
        return jsonResponse({ success: true, message: 'ok', data: category });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <PortfolioCategoryFormModal
        open
        onClose={vi.fn()}
        data={{}}
        type="content.portfolio-category.form"
      />,
      { store: storeWith(['manage']) },
    );

    await user.type(screen.getByLabelText('Slug'), 'web');
    await user.type(screen.getByLabelText('Name'), 'Web');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      slug: 'web',
      name: { ar: 'Web', en: '' },
    });
  });

  it('prefills the form when editing', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ success: true, message: 'ok', data: category }),
        ),
    );
    renderWithProviders(
      <PortfolioCategoryFormModal
        open
        onClose={vi.fn()}
        data={{ item: category }}
        type="content.portfolio-category.form"
      />,
      { store: storeWith(['manage']) },
    );

    expect((screen.getByLabelText('Slug') as HTMLInputElement).value).toBe(
      'web',
    );
    expect((screen.getByLabelText('Name') as HTMLInputElement).value).toBe(
      'الويب',
    );
  });
});
