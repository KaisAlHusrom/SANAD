import { describe, expect, it } from 'vitest';
import type { IdentityContext } from '@sanad/contracts';
import {
  authReducer,
  identityLoaded,
  loggedOut,
  selectIsAuthenticated,
  selectPermissions,
  tokensReceived,
  tokensRefreshed,
} from './auth.slice';
import type { AuthState } from './auth-state.types';

const empty: AuthState = { access: null, refresh: null, identity: null };
const identity: IdentityContext = {
  userId: 'u1',
  roles: ['admin'],
  permissions: ['manage'],
};

describe('auth.slice', () => {
  it('stores the token pair on login', () => {
    const next = authReducer(
      empty,
      tokensReceived({ access: 'a', refresh: 'r' }),
    );
    expect(next).toMatchObject({ access: 'a', refresh: 'r' });
  });

  it('rotates the token pair on refresh, keeping the identity', () => {
    const start: AuthState = { access: 'a', refresh: 'r', identity };
    const next = authReducer(
      start,
      tokensRefreshed({ access: 'a2', refresh: 'r2' }),
    );
    expect(next).toMatchObject({ access: 'a2', refresh: 'r2', identity });
  });

  it('records the identity context', () => {
    const next = authReducer(empty, identityLoaded(identity));
    expect(next.identity).toEqual(identity);
  });

  it('clears everything on logout', () => {
    const start: AuthState = { access: 'a', refresh: 'r', identity };
    expect(authReducer(start, loggedOut())).toEqual(empty);
  });

  it('selectors derive auth + permissions', () => {
    const state = { auth: { access: 'a', refresh: 'r', identity } };
    expect(selectIsAuthenticated(state)).toBe(true);
    expect(selectIsAuthenticated({ auth: empty })).toBe(false);
    expect(selectPermissions(state)).toEqual(['manage']);
    expect(selectPermissions({ auth: empty })).toEqual([]);
  });
});
