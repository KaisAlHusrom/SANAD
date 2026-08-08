import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role, TestimonialItem } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastStore } from '../../../data/toast';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { TestimonialFormModal } from './testimonial-form-modal';

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
  companyName: null,
  avatarMediaId: null,
  rating: null,
  featured: false,
  sortOrder: 0,
  quote: { ar: 'رائع', en: '' },
  authorRole: { ar: '', en: '' },
  companyDescriptor: { ar: '', en: '' },
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

describe('TestimonialFormModal', () => {
  it('creates a testimonial with the pivoted upsert body (nullable rating/company)', async () => {
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
          data: testimonial,
        });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <TestimonialFormModal
        open
        onClose={vi.fn()}
        data={{}}
        type="content.testimonial.form"
      />,
      { store: storeWith(['manage']) },
    );

    await user.type(screen.getByLabelText('Author name'), 'Layla');
    await user.type(screen.getByLabelText('Quote'), 'Great work');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      authorName: 'Layla',
      companyName: null,
      avatarMediaId: null,
      rating: null,
      featured: false,
      quote: { ar: 'Great work', en: '' },
    });
  });
});
