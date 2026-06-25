# auth module (admin-portal)

The login + session module — the first vertical, proving the foundation's data-layer spine end-to-end.

## Files

- `api/auth.api.ts` — RTK Query api (`reducerPath: 'authApi'`, `baseQuery: baseQueryWithAuth`). Endpoints:
  - `login` (`POST /auth/login`, body `LoginRequest`) → `AuthResult`. On success: `tokensReceived(tokens)` + publishes `auth.loggedIn` (W4).
  - `logout` (`POST /auth/logout`, body `{refresh}`) → `LogoutResult`. Clears the local session (`loggedOut`) + publishes `auth.loggedOut` regardless of the server result.
  - `me` (`GET /auth/me`) → `IdentityContext`. On success: `identityLoaded` (roles + permissions). Used by `RequireAuth`.
  - Self-registers via `registerApi(authApi)`. **Refresh is NOT an endpoint here** — it lives inside `baseQueryWithAuth` (F1, one place).
- `hooks/use-login.ts` — form logic (U5): react-hook-form + `loginRequestSchema` (F6); maps `ApiError` → an i18n error key (401 → `errors.invalidCredentials`, transport → `errors.network`); redirects to the remembered `from` (or `/`) on success.
- `hooks/use-logout.ts` — revokes the refresh token, returns to `/login`.
- `components/login-page.tsx` — full-screen login (the documented chrome-less F10 exception); brand logo + form.
- `components/login-form.tsx` — presentation only (Input/Button + per-field + root errors as i18n keys).
- `i18n/{ar,en}.json` — the `auth` catalog (identical key trees, U8); registered at import.

## Contracts

`LoginRequest`, `AuthResult` (`{tokens, user}`), `TokenPair` (`{access, refresh}`), `LogoutResult`, `IdentityContext` — all from `@sanad/contracts` (U3).

## Events

Emits `auth.loggedIn {userId}` and `auth.loggedOut` on the client event bus (W4).

## Tests

`hooks/use-login.spec.tsx` — invalid email blocks submit (F6); valid creds store tokens + navigate; a 401 surfaces `invalidCredentials` (the acceptance proof for the data-layer spine).
