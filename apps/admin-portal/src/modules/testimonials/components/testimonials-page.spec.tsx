import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role, TestimonialItem } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { TestimonialsPage } from './testimonials-page';

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

const testimonial: TestimonialItem = {
  id: 't1',
  authorName: 'Layla',
  companyName: 'Acme',
  avatarMediaId: null,
  rating: 5,
  featured: false,
  sortOrder: 0,
  quote: { ar: 'رائع', en: 'Great work' },
  authorRole: { ar: '', en: '' },
  companyDescriptor: { ar: '', en: '' },
  createdAt: 'x',
  updatedAt: '2026-06-26T10:00:00.000Z',
};

function stubList(items: TestimonialItem[]): ReturnType<typeof vi.fn> {
  const mock = vi.fn().mockImplementation((input: Request) => {
    if (input.method === 'PATCH') {
      return Promise.resolve(
        jsonResponse({
          success: true,
          message: 'ok',
          data: { ...testimonial, featured: true },
        }),
      );
    }
    return Promise.resolve(
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
    );
  });
  vi.stubGlobal('fetch', mock);
  return mock;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('TestimonialsPage', () => {
  it('shows the empty state when there are none', async () => {
    stubList([]);
    renderWithProviders(<TestimonialsPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('No results')).toBeInTheDocument();
  });

  it('renders rows and the create control for content.manage', async () => {
    stubList([testimonial]);
    renderWithProviders(<TestimonialsPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('Layla')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'New testimonial' }),
    ).toBeInTheDocument();
  });

  it('toggles featured via the inline switch (W6)', async () => {
    const mock = stubList([testimonial]);
    const user = userEvent.setup();
    renderWithProviders(<TestimonialsPage />, { store: storeWith(['manage']) });
    await screen.findByText('Layla');

    await user.click(screen.getByRole('switch', { name: 'Featured' }));

    await waitFor(() => {
      const patch = mock.mock.calls.find(
        (call) => (call[0] as Request).method === 'PATCH',
      );
      expect(patch).toBeDefined();
      expect((patch?.[0] as Request).url).toContain('/content/testimonials/t1');
    });
  });
});
