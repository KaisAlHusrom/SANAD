import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type {
  PortfolioCategoryItem,
  PortfolioProjectItem,
  Role,
} from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { toastStore } from '../../../data/toast';
import '../i18n';
import { PortfolioFormModal } from './portfolio-form-modal';

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

const category: PortfolioCategoryItem = {
  id: '11111111-1111-1111-1111-111111111111',
  slug: 'web',
  sortOrder: 0,
  name: { ar: 'الويب', en: 'Web' },
  createdAt: 'x',
  updatedAt: 'x',
};

const project: PortfolioProjectItem = {
  id: 'p1',
  slug: 'acme-app',
  category: { id: category.id, slug: category.slug, name: category.name },
  coverMediaId: null,
  clientName: 'Acme',
  projectUrl: null,
  status: 'published',
  publishedAt: 'x',
  featured: true,
  sortOrder: 0,
  title: { ar: 'تطبيق', en: 'Acme app' },
  summary: { ar: '', en: '' },
  challenge: { ar: '', en: '' },
  solution: { ar: '', en: '' },
  result: { ar: '', en: '' },
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

describe('PortfolioFormModal', () => {
  it('creates a project with the pivoted upsert body (status, nullable → null, localized title)', async () => {
    const posted: Array<Record<string, unknown>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: Request) => {
        if (input.method === 'POST') {
          posted.push((await input.clone().json()) as Record<string, unknown>);
        }
        return jsonResponse({ success: true, message: 'ok', data: project });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <PortfolioFormModal
        open
        onClose={vi.fn()}
        data={{}}
        type="content.portfolio.form"
      />,
      { store: storeWith(['manage']) },
    );

    await user.type(screen.getByLabelText('Slug'), 'acme-app');
    await user.type(screen.getByLabelText('Title'), 'Acme app');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      slug: 'acme-app',
      status: 'draft',
      featured: false,
      categoryId: null,
      coverMediaId: null,
      clientName: null,
      projectUrl: null,
      title: { ar: 'Acme app', en: '' },
    });
  });

  it('prefills the project on edit and resolves the category via the W5 lookup', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation((input: Request) => {
        // The category ServerSelect resolves the selected id off the categories list.
        if (input.url.includes('/content/portfolio-categories')) {
          return Promise.resolve(
            jsonResponse({
              success: true,
              message: 'ok',
              data: {
                items: [category],
                meta: { page: 1, pageSize: 100, total: 1, totalPages: 1 },
              },
            }),
          );
        }
        return Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: project }),
        );
      }),
    );
    renderWithProviders(
      <PortfolioFormModal
        open
        onClose={vi.fn()}
        data={{ item: project }}
        type="content.portfolio.form"
      />,
      { store: storeWith(['manage']) },
    );

    expect((screen.getByLabelText('Slug') as HTMLInputElement).value).toBe(
      'acme-app',
    );
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'تطبيق',
    );
    // The embedded category id resolves to its label through the lookup bridge (W5).
    expect(await screen.findByText('Web')).toBeInTheDocument();
  });
});
