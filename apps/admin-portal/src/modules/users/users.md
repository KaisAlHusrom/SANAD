# users (admin module)

**Purpose.** The users & roles management surface — invite/create team members, edit their
profile, activate/deactivate them, and assign/revoke roles (P7.D, S6). Reads need
`identity.users.read`; writes need `identity.users.manage`.

## Surface

- `UsersPage` (`/users`) — a kit `DataTable`: member (gradient `Avatar` + name + email), role
  `Badge` chips, an inline active-state `Switch` (W6). Row actions: edit, manage roles. An
  "Invite member" button opens the create modal.
- `UserFormModal` (`USER_FORM_MODAL`) — create vs edit (distinct schemas/fields, each its own
  sub-component so hooks stay unconditional). Create: name, email, password (+generate),
  active, staff-roles multi-select. Edit: profile only (roles + password excluded).
- `UserRolesModal` (`USER_ROLES_MODAL`) — toggleable role chips over `ALL_ROLES`; each toggle
  assigns/revokes and reconciles from the returned user.
- `UserStatusCell` — the inline active Switch (manage) or a tinted Badge (read-only).

## Data (W3)

- **api** `users.api.ts` (`reducerPath: usersApi`, registered in `register-apis.ts`):
  `listUsers` (`GET /identity/users`), `createUser` (`POST`), `updateUser` (`PATCH /:id`),
  `assignUserRole` (`POST /:id/roles`), `revokeUserRole` (`DELETE /:id/roles/:role`). Every
  mutation invalidates the `User` LIST tag and publishes `identity.user.changed` (W4).
- **hooks** `use-users-list`, `use-user-create-form` / `use-user-edit-form` (FieldConfig +
  submit), `use-toggle-user-active` (Switch), `use-user-roles` (chip assign/revoke).

## Contracts (`@sanad/contracts`, U3)

New: `userCreateSchema`, `userUpdateSchema`, `userRoleAssignSchema`, `RoleSummary`. Role
**values** come from the static `STAFF_ROLES`/`ALL_ROLES` unions (offline-safe); role **labels**
are localized in this module's i18n (U8 — the backend role names aren't translatable). The
`GET /identity/roles` endpoint (`RoleSummary`) exists for a future roles-admin surface.

## Events

- **Publishes:** `identity.user.changed` (create / update / role change) — the dashboard
  refetches its team-member count.
- **Consumes:** none.

## Gateway routes used (all NEW in S5)

`GET /api/identity/users` (`identity.users.read`), `POST /api/identity/users`,
`PATCH /api/identity/users/:id`, `POST /api/identity/users/:id/roles`,
`DELETE /api/identity/users/:id/roles/:role` (all `identity.users.manage`),
`GET /api/identity/roles` (`identity.roles.read`). Added to `docs/postman` (DOC2).

## i18n

`users` namespace (`i18n/{ar,en}.json`, parity-checked), including localized role labels.
