import { screen } from '@testing-library/react';
import { SECRET_REGISTRY, type Role } from '@sanad/contracts';
import { beforeEach, describe, expect, it } from 'vitest';
import { identityLoaded } from '../../../data/auth/auth.slice';
import { createAppStore } from '../../../data/store/store';
import { i18n } from '../../../i18n';
import { renderWithProviders } from '../../../test/render-with-providers';
// Import via the module index so its i18n catalog registers (matches the auth pattern).
import { SecretsTable, type SecretRow } from '../index';

const rows: SecretRow[] = [
  {
    entry: SECRET_REGISTRY.SMTP_PASSWORD,
    status: {
      key: 'SMTP_PASSWORD',
      isSet: true,
      fromEnv: false,
      last4: '1234',
      updatedAt: '2026-06-25T00:00:00.000Z',
      updatedByUserId: 'u1',
    },
  },
  {
    entry: SECRET_REGISTRY.R2_SECRET_KEY,
    status: {
      key: 'R2_SECRET_KEY',
      isSet: false,
      fromEnv: false,
      last4: null,
      updatedAt: null,
      updatedByUserId: null,
    },
  },
];

function storeWithPermissions(
  permissions: string[],
  roles: Role[] = ['admin'],
) {
  const store = createAppStore();
  store.dispatch(identityLoaded({ userId: 'u1', roles, permissions }));
  return store;
}

beforeEach(async () => {
  await i18n.changeLanguage('en');
  localStorage.clear();
});

describe('SecretsTable (masked, per-integration RBAC)', () => {
  it('renders one row per registered secret with masked status', () => {
    renderWithProviders(<SecretsTable rows={rows} />, {
      store: storeWithPermissions(['manage']),
    });

    expect(screen.getByText('SMTP_PASSWORD')).toBeInTheDocument();
    expect(screen.getByText('R2_SECRET_KEY')).toBeInTheDocument();
    // mask states + last4, never any plaintext
    expect(screen.getByText('Set in vault')).toBeInTheDocument();
    expect(screen.getByText('Not set')).toBeInTheDocument();
    expect(screen.getByText('••••1234')).toBeInTheDocument();
    // the deferred (wired:false) R2 secret is flagged
    expect(screen.getByText('Not in use yet')).toBeInTheDocument();
  });

  it('shows Rotate/Set actions only with admin (global manage)', () => {
    renderWithProviders(<SecretsTable rows={rows} />, {
      store: storeWithPermissions(['manage']),
    });
    expect(screen.getByRole('button', { name: 'Rotate' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Set' })).toBeInTheDocument();
  });

  it('gates each action by its per-integration permission', () => {
    renderWithProviders(<SecretsTable rows={rows} />, {
      // can manage email (SMTP) only — NOT storage (R2)
      store: storeWithPermissions(
        ['settings.secrets.email.manage'],
        ['developer'],
      ),
    });
    // SMTP is set → Rotate visible; R2 has no manage permission → no Set button
    expect(screen.getByRole('button', { name: 'Rotate' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Set' }),
    ).not.toBeInTheDocument();
  });

  it('hides all actions without any manage permission', () => {
    renderWithProviders(<SecretsTable rows={rows} />, {
      store: storeWithPermissions(['settings.secrets.read'], ['developer']),
    });
    expect(
      screen.queryByRole('button', { name: 'Rotate' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Set' }),
    ).not.toBeInTheDocument();
  });
});
