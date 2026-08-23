import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Lead, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
import { selectOption } from '../../../test/select-option';
import '../i18n';
import { LeadsPage } from './leads-page';

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof Request) return input.url;
  return input.toString();
}

function methodOf(input: RequestInfo | URL, init?: RequestInit): string {
  if (input instanceof Request) return input.method;
  return init?.method ?? 'GET';
}

function storeWith(permissions: string[], roles: Role[] = ['admin']) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u', roles, permissions }));
  return store;
}

const lead: Lead = {
  id: 'l1',
  name: 'Layla Hassan',
  email: 'layla@example.com',
  phone: '+966501234567',
  company: 'Acme',
  budget: null,
  projectType: 'SaaS',
  message: 'We need a platform',
  source: 'contact',
  locale: 'ar',
  status: 'new',
  submissionCount: 1,
  lastSubmittedAt: '2026-06-30T10:00:00.000Z',
  spamScore: 0,
  spamSignals: [],
  createdAt: '2026-06-30T10:00:00.000Z',
  updatedAt: '2026-06-30T10:00:00.000Z',
};

const flagged: Lead = {
  ...lead,
  id: 'l2',
  name: 'seo-master',
  spamScore: 91,
  spamSignals: [
    { id: 'keywords', weight: 45, n: 3 },
    { id: 'links', weight: 36, n: 3 },
    { id: 'shouting', weight: 10 },
  ],
};

const fetchMock = vi.fn();

function stub(items: Lead[]): void {
  fetchMock.mockImplementation(
    (input: RequestInfo | URL, init?: RequestInit) => {
      if (methodOf(input, init) === 'PATCH') {
        return Promise.resolve(
          jsonResponse({
            success: true,
            message: 'ok',
            data: { ...lead, status: 'contacted' },
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
    },
  );
  vi.stubGlobal('fetch', fetchMock);
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
  fetchMock.mockReset();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('LeadsPage', () => {
  it('reassures on a first-use empty inbox, with nothing to clear', async () => {
    stub([]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('No leads yet')).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Show all leads' }),
    ).not.toBeInTheDocument();
  });

  it('offers a way back when a filter matched nothing (U23)', async () => {
    stub([]);
    renderWithProviders(<LeadsPage />, {
      store: storeWith(['manage']),
      route: '/leads?spam=likelySpam',
    });
    expect(
      await screen.findByText('No leads match these filters'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Show all leads' }),
    ).toBeInTheDocument();
  });

  it('renders a lead row with name and email', async () => {
    stub([lead]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('Layla Hassan')).toBeInTheDocument();
    expect(screen.getByText('layla@example.com')).toBeInTheDocument();
  });

  it('stays quiet for a lead that only ever wrote once', async () => {
    stub([lead]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    await screen.findByText('Layla Hassan');
    expect(screen.queryByTitle(/submitted/i)).not.toBeInTheDocument();
    expect(screen.queryByText('×2')).not.toBeInTheDocument();
  });

  it('flags a repeat submitter with the count (P8.10.B2)', async () => {
    stub([
      {
        ...lead,
        submissionCount: 3,
        lastSubmittedAt: '2026-07-02T09:00:00.000Z',
      },
    ]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    expect(await screen.findByText('×3')).toBeInTheDocument();
  });

  it('renders the phone as a readable, one-tap call link (P8.10.B1)', async () => {
    stub([lead]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    const call = await screen.findByRole('link', { name: '+966 50 123 4567' });
    expect(call).toHaveAttribute('href', 'tel:+966501234567');
    expect(call).toHaveAttribute('dir', 'ltr');
  });

  it('shows a placeholder for a lead captured before the phone field existed', async () => {
    stub([{ ...lead, phone: null }]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    await screen.findByText('Layla Hassan');
    expect(
      screen.queryByRole('link', { name: /\+966/ }),
    ).not.toBeInTheDocument();
    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
  });

  it('changes a lead status via the inline select (manager)', async () => {
    const user = userEvent.setup();
    stub([lead]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    await screen.findByText('Layla Hassan');

    await selectOption(user, 'Change status', 'Contacted');

    await waitFor(() => {
      expect(
        fetchMock.mock.calls.some(
          ([input, init]) =>
            urlOf(input as RequestInfo | URL).includes('/leads/l1') &&
            methodOf(input as RequestInfo | URL, init as RequestInit) ===
              'PATCH',
        ),
      ).toBe(true);
    });
  });

  it('leaves the spam column blank for a clean lead (P8.10.B3)', async () => {
    stub([lead]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    await screen.findByText('Layla Hassan');
    expect(screen.queryByText('0')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /spam score/i }),
    ).not.toBeInTheDocument();
  });

  it('flags a likely-spam lead with its score, and breaks it down on demand', async () => {
    const user = userEvent.setup();
    stub([lead, flagged]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    await screen.findByText('seo-master');

    const badge = screen.getByRole('button', { name: /spam score 91/i });
    await user.click(badge);
    expect(await screen.findByText(/Known spam phrases/)).toBeInTheDocument();
    expect(screen.getByText(/never blocks/i)).toBeInTheDocument();
  });

  it('offers the spam filter in the toolbar', async () => {
    stub([lead]);
    renderWithProviders(<LeadsPage />, { store: storeWith(['manage']) });
    await screen.findByText('Layla Hassan');
    expect(screen.getByRole('combobox', { name: 'Spam' })).toBeInTheDocument();
  });

  it('shows a read-only status badge without content.manage', async () => {
    stub([lead]);
    renderWithProviders(<LeadsPage />, {
      store: storeWith(['content.read'], ['developer']),
    });
    expect(await screen.findByText('Layla Hassan')).toBeInTheDocument();
    expect(
      screen.queryByRole('combobox', { name: 'Change status' }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
  });
});
