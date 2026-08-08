import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Role, ServiceItem } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { toastStore } from '../../../data/toast';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { selectOption } from '../../../test/select-option';
import '../i18n';
import { ServiceFormModal } from './service-form-modal';

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

const service: ServiceItem = {
  id: 's1',
  slug: 'saas',
  iconKey: null,
  category: 'core',
  coverMediaId: null,
  sortOrder: 0,
  title: { ar: 'منصة', en: 'SaaS platform' },
  summary: { ar: '', en: '' },
  detailBody: { ar: '', en: '' },
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

describe('ServiceFormModal', () => {
  it('creates a service with the pivoted upsert body', async () => {
    const posted: Array<Record<string, unknown>> = [];
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(async (input: Request) => {
        if (input.method === 'POST') {
          posted.push((await input.clone().json()) as Record<string, unknown>);
        }
        return jsonResponse({ success: true, message: 'ok', data: service });
      }),
    );
    const user = userEvent.setup();
    renderWithProviders(
      <ServiceFormModal
        open
        onClose={vi.fn()}
        data={{}}
        type="content.service.form"
      />,
      { store: storeWith(['manage']) },
    );

    await user.type(screen.getByLabelText('Slug'), 'saas');
    await selectOption(user, 'Category', 'Core');
    await user.type(screen.getByLabelText('Title'), 'SaaS platform');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toMatchObject({
      slug: 'saas',
      category: 'core',
      coverMediaId: null,
      title: { ar: 'SaaS platform', en: '' },
    });
  });

  it('prefills the form when editing', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(
          jsonResponse({ success: true, message: 'ok', data: service }),
        ),
    );
    renderWithProviders(
      <ServiceFormModal
        open
        onClose={vi.fn()}
        data={{ item: service }}
        type="content.service.form"
      />,
      { store: storeWith(['manage']) },
    );

    expect((screen.getByLabelText('Slug') as HTMLInputElement).value).toBe(
      'saas',
    );
    expect((screen.getByLabelText('Title') as HTMLInputElement).value).toBe(
      'منصة',
    );
  });
});
