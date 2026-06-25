import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Route, Routes } from 'react-router-dom';
import { identityLoaded, tokensReceived } from '../../data/auth/auth.slice';
import { createAppStore } from '../../data/store/store';
import { renderWithProviders } from '../../test/render-with-providers';
import { RequireAuth } from './require-auth';

function tree() {
  return (
    <Routes>
      <Route path="/login" element={<div>login page</div>} />
      <Route element={<RequireAuth />}>
        <Route path="/" element={<div>protected</div>} />
      </Route>
    </Routes>
  );
}

describe('RequireAuth', () => {
  it('redirects to /login when unauthenticated', () => {
    renderWithProviders(tree(), { route: '/' });
    expect(screen.getByText('login page')).toBeInTheDocument();
    expect(screen.queryByText('protected')).not.toBeInTheDocument();
  });

  it('renders the protected outlet when authenticated', () => {
    const store = createAppStore();
    store.dispatch(tokensReceived({ access: 'a', refresh: 'r' }));
    store.dispatch(
      identityLoaded({
        userId: 'u1',
        roles: ['admin'],
        permissions: ['manage'],
      }),
    );
    renderWithProviders(tree(), { route: '/', store });
    expect(screen.getByText('protected')).toBeInTheDocument();
  });
});
