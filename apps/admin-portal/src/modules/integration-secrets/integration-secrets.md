# integration-secrets module (admin-portal)

The admin surface for third-party integration secrets (N13 vault) — masked statuses + per-third-party set/rotate. Built in P7.B.

## Files

- `api/integration-secrets.api.ts` — RTK Query api (`reducerPath: 'integrationSecretsApi'`, `baseQuery: baseQueryWithAuth`). Endpoints:
  - `listSecrets` (`GET /integration-secrets`) → `SecretStatus[]` (masked). Provides `Secret` tags per key + `LIST`.
  - `setSecret` (`PUT /integration-secrets/:key`, body `{value}`) → `SecretStatus`. Invalidates the row + `LIST` (no domain event — no other module reacts to a secret change, W4). The plaintext `value` is write-only, never returned.
  - Self-registers via `registerApi`.
- `hooks/use-secrets-list.ts` — merges `SECRET_REGISTRY_LIST` (the rows that exist + their RBAC/wired flags) with the fetched masked statuses (U5); one row per registered third party, always.
- `hooks/use-secret-row.ts` — per-row display derivations (status label/tone, masked `••••last4`) + per-integration RBAC (`useRequirePermission(entry.managePermission)`).
- `hooks/use-set-secret.ts` — set/rotate form logic (U5/F6): the single-field `setSecretRequestSchema` form. The dialog is a global-registry modal, so open/close is owned by the registry (takes `onClose`) — on success it toasts + closes; on error it keeps the dialog open with an inline + toast message. The write-only `value` is cleared on success so no plaintext lingers.
- `components/secrets-page.tsx` — `RenderGate(listSecrets)` → `SecretsTable` (skeleton / error; never empty — the registry always has rows).
- `components/secrets-table.tsx` + `secret-row.tsx` — masked list; each row shows key, feature, `not set`/`set in vault`/`set from env`, `••••last4`, last-updated (via the shared `formatDateTime`, F8), a `not in use yet` badge when `wired:false`, and a Set/Rotate trigger **gated by the entry's `managePermission`** that opens the `integration-secret.set` registry modal with `{key, isSet}`.
- `components/set-secret-modal.tsx` — a global-registry modal (`SET_SECRET_MODAL`); narrows the registry payload to a known `SecretRegistryEntry` (via `secretKeySchema`, U4), renders the password-type value field.
- `modals.config.ts` — registers `SetSecretModal` for the `integration-secret.set` type (W7); imported once from `src/app/modals.config.ts`.
- `i18n/{ar,en}.json` — the `integrationSecrets` catalog (identical key trees, U8); registered at import.

## Contracts

`SecretStatus`, `SecretKey`, `SecretRegistryEntry` (now carries `managePermission`), `SECRET_REGISTRY`/`SECRET_REGISTRY_LIST`, `setSecretRequestSchema`/`SetSecretRequest`, `SECRET_PERMISSIONS` — all from `@sanad/contracts` (U3).

## RBAC (N13 — gated per-integration)

- Page/list: `settings.secrets.read` (the nav entry + route guard).
- Set/rotate: each third party owns `settings.secrets.<feature>.manage` (carried on the registry entry). The gateway's `SecretPermissionGuard` enforces it server-side; the UI mirrors it per row (admin's global `manage` covers all).

## Events

None — secret changes are local; the row refreshes via RTK tag invalidation (W4 — no cross-module consumer).

## Tests

- `api/integration-secrets.api.spec.ts` — list (envelope unwrapped) + set (PUT `:key` body `{value}`, **no plaintext kept in the store**).
- `hooks/use-set-secret.spec.tsx` — opened via the registry (`GlobalModalManager` + `Toaster`): empty value blocks submit (no request); a valid value PUTs + toasts success + closes; a 403 keeps the dialog open with an inline + toast forbidden message.
- `components/secrets-table.spec.tsx` — one row per registry entry, mask states + `••••last4`, the `wired:false` badge, and per-integration action gating (admin manage vs `settings.secrets.email.manage` only vs read-only).
