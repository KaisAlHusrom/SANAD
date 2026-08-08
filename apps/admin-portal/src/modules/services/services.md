# services (admin module)

Manages the **service** content collection (the website "services" page capabilities) from the
admin portal. Built entirely from the shared UI kit (DataTable + DynamicFormModal +
ConfirmationModal + toast + modal registry) — no bespoke table/form/dialog (P7.C Stage 1).

## Surface

- **`/content/services`** (`content.read`) → `ServicesPage`: a kit `DataTable` (search, a
  `category` filter, pagination, RBAC-gated row Edit/Delete, bulk delete) over
  `GET /content/services`.
- **Create/edit**: `ServiceFormModal` (global-registry `content.service.form`) → a
  `DynamicFormModal` whose translatable `title`/`summary`/`detailBody` edit per-locale under
  LocaleTabs (W6). `coverMediaId` is picked with the shared `MediaIdPickerField` (W5).
- **Delete**: the shared mutation-aware `useConfirm` + toast (single + bulk).

## Contracts (`@sanad/contracts`)

- `ServiceItem` (read), `ServiceCreateRequest` / `ServiceUpdateRequest` (`Omit<…,'id'>` PATCH
  body), `ServiceListQuery` (`category` filter), `serviceCategorySchema` (`core` | `support`).
- Local form shape: `serviceFormSchema` (`schema/service-form.zod.types.ts`) — the contract
  with translatable fields nested under `translations` (kit convention) and coerced numbers.
  The `localized-form` helpers pivot entity ↔ form ↔ upsert body.

## Endpoints (gateway, all pre-existing — no Postman drift)

`GET /content/services` (public/admin) · `POST /content/services` · `PATCH /content/services/:id`
· `DELETE /content/services/:id` (writes `content.manage`).

## Events

Publishes `content.service.changed` on the client event bus after each successful mutation (W4).

## Permissions

`content.read` (view) · `content.manage` (create/edit/delete + the create button + row/bulk
actions).
