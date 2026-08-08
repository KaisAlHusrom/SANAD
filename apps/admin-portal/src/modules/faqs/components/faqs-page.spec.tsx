import { screen } from '@testing-library/react';
import type { FaqItem, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { FaqsPage } from './faqs-page';

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

const faq: FaqItem = {
  id: 'f1',
  category: 'pricing',
  sortOrder: 0,
  question: { ar: 'كم التكلفة؟', en: 'How much does it cost?' },
  answer: { ar: 'يعتمد', en: 'It depends' },
  createdAt: 'x',
  updatedAt: '2026-06-26T10:00:00.000Z',
};

function stubList(items: FaqItem[]): void {
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

describe('FaqsPage', () => {
  it('shows the empty state when there are none', async () => {
    stubList([]);
    renderWithProviders(<FaqsPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('renders rows and the create control for content.manage', async () => {
    stubList([faq]);
    renderWithProviders(<FaqsPage />, { store: storeWith(['manage']) });
    expect(
      await screen.findByText('How much does it cost?'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New question' }),
    ).toBeInTheDocument();
  });
});
