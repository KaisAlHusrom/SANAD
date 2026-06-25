import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { IdentityContext, TokenPair } from '@sanad/contracts';
import type { AuthRoot, AuthState } from './auth-state.types';
import { readAuthFromStorage } from './auth.storage';

// Seed the first frame synchronously from storage (F12) — never async hydration.
const initialState: AuthState = readAuthFromStorage();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /** After a successful login. */
    tokensReceived(state, action: PayloadAction<TokenPair>) {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh;
    },
    /** After a silent refresh (rotated pair). */
    tokensRefreshed(state, action: PayloadAction<TokenPair>) {
      state.access = action.payload.access;
      state.refresh = action.payload.refresh;
    },
    /** After `GET /auth/me` resolves the identity + permissions. */
    identityLoaded(state, action: PayloadAction<IdentityContext>) {
      state.identity = action.payload;
    },
    /** On logout or a failed refresh. */
    loggedOut(state) {
      state.access = null;
      state.refresh = null;
      state.identity = null;
    },
  },
});

export const { tokensReceived, tokensRefreshed, identityLoaded, loggedOut } =
  authSlice.actions;
export const authReducer = authSlice.reducer;

// Selectors typed against the minimal `AuthRoot` so the slice never imports the store
// (W3 — no store back-edge).
export const selectAccessToken = (state: AuthRoot): string | null =>
  state.auth.access;
export const selectRefreshToken = (state: AuthRoot): string | null =>
  state.auth.refresh;
export const selectIdentity = (state: AuthRoot): IdentityContext | null =>
  state.auth.identity;
export const selectIsAuthenticated = (state: AuthRoot): boolean =>
  state.auth.access !== null;
export const selectPermissions = (state: AuthRoot): readonly string[] =>
  state.auth.identity?.permissions ?? [];
