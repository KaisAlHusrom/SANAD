import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IntegrationCapabilityStatus, Role } from '@sanad/contracts';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { GlobalModalManager } from '../../../components/modal/global-modal-manager';
import { renderWithProviders } from '../../../test/render-with-providers';
import '../i18n';
// Registers the provider-config modal with the global registry (W7) — the modal only renders
// when the manager is mounted, so the open-modal test needs both.
import '../modals.config';
import { IntegrationsPage } from './integrations-page';

/** Storage has R2 configured + active; email has SMTP unconfigured (the owner's real shape). */
const CATALOG: IntegrationCapabilityStatus[] = [
  {
    capability: 'storage',
    activeProvider: 'r2',
    providers: [
      {
        provider: 'r2',
        configured: true,
        fields: [
          { key: 'bucket', isSet: true, last4: null, value: 'my-bucket' },
          { key: 'secretAccessKey', isSet: true, last4: 'e589', value: null },
        ],
        updatedAt: '2026-07-19T00:00:00.000Z',
        updatedByUserId: 'u1',
      },
    ],
  },
  {
    capability: 'email',
    activeProvider: null,
    providers: [
      {
        provider: 'smtp',
        configured: false,
        fields: [],
        updatedAt: null,
        updatedByUserId: null,
      },
    ],
  },
];

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

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
  vi.stubGlobal(
    'fetch',
    vi
      .fn()
      .mockResolvedValue(
        jsonResponse({ success: true, message: 'ok', data: CATALOG }),
      ),
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('IntegrationsPage (capability → providers → active)', () => {
  it('groups providers under CAPABILITY cards, not one row per credential key', async () => {
    renderWithProviders(<IntegrationsPage />, {
      store: storeWith(['manage']),
    });

    // one card per capability
    expect(await screen.findByText('Storage')).toBeInTheDocument();
    expect(screen.getByText('Email')).toBeInTheDocument();
    // providers inside them (the name also appears in the header's active badge)
    expect(screen.getAllByText('Cloudflare R2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('SMTP').length).toBeGreaterThan(0);
    // the individual credential keys are NOT rows anymore
    expect(screen.queryByText('R2_SECRET_KEY')).not.toBeInTheDocument();
    expect(screen.queryByText('R2_BUCKET')).not.toBeInTheDocument();
  });

  it('shows which provider is active and which is unconfigured', async () => {
    renderWithProviders(<IntegrationsPage />, {
      store: storeWith(['manage']),
    });
    await screen.findAllByText('Cloudflare R2');
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Configured')).toBeInTheDocument();
    expect(screen.getByText('Not configured')).toBeInTheDocument();
    expect(screen.getByText('None selected')).toBeInTheDocument();
  });

  it('opens the provider configuration modal from Configure', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <>
        <IntegrationsPage />
        <GlobalModalManager />
      </>,
      { store: storeWith(['manage']) },
    );
    await screen.findAllByText('Cloudflare R2');
    const [configureButton] = screen.getAllByRole('button', {
      name: 'Configure',
    });
    if (!configureButton) {
      throw new Error('expected a Configure button');
    }
    await user.click(configureButton);
    await waitFor(() =>
      expect(screen.getByText('Configure Cloudflare R2')).toBeInTheDocument(),
    );
  });

  it('disables Test/Set active until a provider is configured', async () => {
    renderWithProviders(<IntegrationsPage />, {
      store: storeWith(['manage']),
    });
    await screen.findAllByText('SMTP');
    // SMTP is unconfigured → its Test button is disabled
    const testButtons = screen.getAllByRole('button', {
      name: 'Test connection',
    });
    expect(testButtons.at(-1)).toBeDisabled();
  });

  it('hides write actions without the capability manage permission', async () => {
    renderWithProviders(<IntegrationsPage />, {
      store: storeWith(['settings.integrations.read'], ['developer']),
    });
    await screen.findAllByText('Cloudflare R2');
    expect(
      screen.queryByRole('button', { name: 'Configure' }),
    ).not.toBeInTheDocument();
  });
});
