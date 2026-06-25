import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { identityLoaded, tokensReceived } from '../../data/auth/auth.slice';
import { createAppStore } from '../../data/store/store';
import { renderWithProviders } from '../../test/render-with-providers';
import { RequirePermission } from './require-permission';

function storeWith(permissions: string[]) {
  const store = createAppStore();
  store.dispatch(tokensReceived({ access: 'a', refresh: 'r' }));
  store.dispatch(
    identityLoaded({ userId: 'u1', roles: ['developer'], permissions }),
  );
  return store;
}

describe('RequirePermission', () => {
  it('renders children when the permission is held', () => {
    renderWithProviders(
      <RequirePermission permission="content.read">
        <div>allowed</div>
      </RequirePermission>,
      { store: storeWith(['content.read']) },
    );
    expect(screen.getByText('allowed')).toBeInTheDocument();
  });

  it('shows a forbidden notice when the permission is missing', () => {
    renderWithProviders(
      <RequirePermission permission="settings.manage">
        <div>allowed</div>
      </RequirePermission>,
      { store: storeWith(['content.read']) },
    );
    expect(screen.queryByText('allowed')).not.toBeInTheDocument();
  });
});
