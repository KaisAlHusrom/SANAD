# team (admin module)

Manages the **team_member** content collection (website about/team page) from the admin portal,
built entirely from the shared UI kit (P7.C Stage 1).

## Surface

- **`/content/team`** (`content.read`) → `TeamPage`: a kit `DataTable` with a `featured` boolean
  filter, an **inline `featured` Switch** wired to the update mutation (W6, `content.manage`-gated),
  RBAC row Edit/Delete, and bulk delete.
- **Create/edit**: `TeamFormModal` (`content.team-member.form`) → `DynamicFormModal`; translatable
  `name`/`role`/`bio` per-locale under LocaleTabs (W6); `avatarMediaId` via the shared
  `MediaIdPickerField` (W5); `email`/`linkedinUrl`/`githubUrl` validated, '' → null.
- **Delete**: shared mutation-aware `useConfirm` + toast (single + bulk).

## Contracts (`@sanad/contracts`)

- `TeamMemberItem` (read), `TeamMemberCreateRequest` / `TeamMemberUpdateRequest`
  (`Omit<…,'id'>` PATCH body, partial — used by the inline featured toggle),
  `TeamMemberListQuery` (`featured` filter via `booleanParamSchema`).
- Local form shape: `teamMemberFormSchema` (`schema/`) — translatable fields nested under
  `translations`; social fields are '' (none) or validated URLs/email; coerced numbers.

## Endpoints (pre-existing — no Postman drift)

`GET /content/team` · `POST` · `PATCH /:id` · `DELETE /:id` (writes `content.manage`).

## Events

Publishes `content.team-member.changed` after each successful mutation (W4).

## Permissions

`content.read` (view) · `content.manage` (create/edit/delete + the featured toggle + row/bulk
actions).
