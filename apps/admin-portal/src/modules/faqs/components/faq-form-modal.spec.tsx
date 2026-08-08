import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { FaqItem, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastStore } from '../../../data/toast';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
import { FaqFormModal } from './faq-form-modal';

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
  category: null,
  sortOrder: 0,
  question: { ar: '', en: '' },
  answer: { ar: '', en: '' },
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

describe('FaqFormModal', () => {
  it('creates an FAQ with the pivoted body (ungrouped category → null)', async () => {
    const posted: Array<Record<string, unknown>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: Request) => {
        if (input.method === 'POST') {
          posted.push((await input.clone().json()) as Record<string, unknown>);
        }
        return jsonResponse({ success: true, message: 'ok', data: faq });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <FaqFormModal open onClose={vi.fn()} data={{}} type="content.faq.form" />,
      { store: storeWith(['manage']) },
    );

    await user.type(screen.getByLabelText('Question'), 'How much?');
    await user.type(screen.getByLabelText('Answer'), 'It depends');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      category: null,
      question: { ar: 'How much?', en: '' },
      answer: { ar: 'It depends', en: '' },
    });
  });
});
