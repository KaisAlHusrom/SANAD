import { screen } from '@testing-library/react';
import type { MenuSummary, MenuTree, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { toastStore } from '../../../data/toast';
import '../i18n';
import { MenusPage } from './menus-page';

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

const primary: MenuSummary = {
  id: 'm1',
  key: 'primary',
  sortOrder: 0,
  createdAt: 'x',
  updatedAt: 'y',
};

const tree: MenuTree = {
  id: 'm1',
  key: 'primary',
  sortOrder: 0,
  items: [
    {
      id: 'i1',
      url: '/services',
      icon: null,
      sortOrder: 0,
      label: { ar: 'خدماتنا', en: 'Services' },
      children: [],
    },
  ],
  createdAt: 'x',
  updatedAt: 'y',
};

function stub(menus: MenuSummary[], menuTree?: MenuTree): void {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((input: Request) => {
      const url = typeof input === 'string' ? input : input.url;
      const data = url.includes('/content/menus/') ? menuTree : menus;
      return Promise.resolve(
        jsonResponse({ success: true, message: 'ok', data }),
      );
    }),
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

describe('MenusPage', () => {
  it('shows the create prompt when the keyed menu has not been created', async () => {
    stub([]);
    renderWithProviders(<MenusPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('Header menu')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Create menu' }),
    ).toBeInTheDocument();
  });

  it('renders the item editor when the menu exists', async () => {
    stub([primary], tree);
    renderWithProviders(<MenusPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('Services')).toBeInTheDocument();
    expect(
      await screen.findByRole('button', { name: 'Add item' }),
    ).toBeInTheDocument();
  });
});
