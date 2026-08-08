import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { PageTree, Role } from '@sanad/contracts';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import '../../../data/store/register-apis';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { toastStore } from '../../../data/toast';
import '../i18n';
import { PageBuilderPage } from './page-builder-page';

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

const tree: PageTree = {
  id: 'pg1',
  slug: 'landing',
  status: 'draft',
  sortOrder: 0,
  title: { ar: 'الرئيسية', en: 'Landing' },
  metaTitle: { ar: '', en: '' },
  metaDescription: { ar: '', en: '' },
  sections: [
    {
      id: 's1',
      type: 'hero',
      sortOrder: 0,
      published: true,
      eyebrow: { ar: '', en: '' },
      title: { ar: 'البطل', en: 'Hero' },
      subtitle: { ar: '', en: '' },
      blocks: [],
      config: null,
      collection: null,
    },
  ],
  createdAt: 'x',
  updatedAt: 'y',
};

function stubTree(): void {
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockImplementation(() =>
        Promise.resolve(
          jsonResponse({ success: true, message: 'ok', data: tree }),
        ),
      ),
  );
}

function renderBuilder(): void {
  const store = storeWith(['manage']);
  const router = createMemoryRouter(
    [{ path: '/content/pages/:id', element: <PageBuilderPage /> }],
    { initialEntries: ['/content/pages/pg1'] },
  );
  render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        <RouterProvider router={router} />
      </I18nextProvider>
    </Provider>,
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

describe('PageBuilderPage', () => {
  it('renders the whole page as a preview-first editable canvas (preview === live)', async () => {
    stubTree();
    renderBuilder();
    // the page header + the live canvas rendering the section via the shared @sanad/web-ui renderer
    expect(await screen.findByText('Landing')).toBeInTheDocument();
    expect(await screen.findByText('Hero')).toBeInTheDocument();
    expect(screen.getByText('Live preview')).toBeInTheDocument();
    expect(document.querySelector('.sanad-web')).toBeInTheDocument();
    expect(screen.getByText('sanad.tech/landing')).toBeInTheDocument();
    // No stale "select a section" prompt — the whole page is the canvas now.
    expect(screen.queryByText('Select a section')).not.toBeInTheDocument();
  });

  it('opens the slide-in structural rail from the canvas toolbar', async () => {
    stubTree();
    const user = userEvent.setup();
    renderBuilder();

    await user.click(await screen.findByRole('button', { name: /Structure/i }));

    // the rail (a dialog) appears with the sections outline + add menu
    expect(await screen.findByText('Page structure')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});
