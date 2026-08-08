# faqs (admin module)

Manages the **FAQ** content collection (website FAQ page) from the admin portal, built entirely
from the shared UI kit (P7.C Stage 1). A **list-only** collection — no slug — grouped by an
optional `category` enum.

## Surface

- **`/content/faqs`** (`content.read`) → `FaqsPage`: a kit `DataTable` with a `category` filter,
  RBAC row Edit/Delete, and bulk delete.
- **Create/edit**: `FaqFormModal` (`content.faq.form`) → `DynamicFormModal`; translatable
  `question`/`answer` per-locale under LocaleTabs (W6); `category` is a plain `<select>` over the
  coded enum (W5) with an "ungrouped" empty option.
- **Delete**: shared mutation-aware `useConfirm` + toast (single + bulk).

## Contracts (`@sanad/contracts`)

- `FaqItem` (read), `FaqCreateRequest` / `FaqUpdateRequest` (`Omit<…,'id'>` PATCH body),
  `FaqListQuery` (`category` filter), `faqCategorySchema`
  (`general` | `pricing` | `process` | `support`, nullable).
- Local form shape: `faqFormSchema` (`schema/`) — translatable fields nested under
  `translations`; `category` is '' (ungrouped → null) or an enum value; coerced numbers.

## Endpoints (pre-existing — no Postman drift)

`GET /content/faqs` · `POST` · `PATCH /:id` · `DELETE /:id` (writes `content.manage`).

## Events

Publishes `content.faq.changed` after each successful mutation (W4).

## Permissions

`content.read` (view) · `content.manage` (create/edit/delete + row/bulk actions).
