import type { IdentityContext } from '@sanad/contracts';

/**
 * The persisted auth state. `access`/`refresh` are the JWT pair; `identity` is the
 * resolved `IdentityContext` (roles + permissions) fetched from `GET /auth/me` — the
 * client never decodes the token (avoids a CJS jwt lib; the gateway is authoritative).
 */
export interface AuthState {
  access: string | null;
  refresh: string | null;
  identity: IdentityContext | null;
}

/** A reducer/selector root that carries the auth slice (avoids a store back-edge). */
export interface AuthRoot {
  auth: AuthState;
}
