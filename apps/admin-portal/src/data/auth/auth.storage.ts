import { identityContextSchema } from '@sanad/contracts';
import { z } from 'zod';
import { AUTH_STORAGE_KEY } from './auth.constants';
import type { AuthState } from './auth-state.types';

/** A logged-out state. */
export function emptyAuthState(): AuthState {
  return { access: null, refresh: null, identity: null };
}

// A stored blob is only honored if it has BOTH tokens; anything else (corrupt JSON,
// partial write, tampering) fails closed to logged-out (F12 — synchronous + safe).
const storedAuthSchema = z
  .object({
    access: z.string().min(1),
    refresh: z.string().min(1),
    identity: identityContextSchema.nullable().default(null),
  })
  .strict();

/** Synchronously read the persisted auth state at module load (F12). */
export function readAuthFromStorage(): AuthState {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) {
      return emptyAuthState();
    }
    const result = storedAuthSchema.safeParse(JSON.parse(raw));
    if (!result.success) {
      return emptyAuthState();
    }
    return {
      access: result.data.access,
      refresh: result.data.refresh,
      identity: result.data.identity,
    };
  } catch {
    return emptyAuthState();
  }
}

/** Persist the auth state, or clear storage when logged out (no tokens). */
export function writeAuthToStorage(state: AuthState): void {
  if (!state.access || !state.refresh) {
    clearAuthStorage();
    return;
  }
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
}

/** Remove the persisted auth state. */
export function clearAuthStorage(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY);
}
