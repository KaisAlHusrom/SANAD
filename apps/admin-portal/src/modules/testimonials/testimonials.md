# testimonials (admin module)

Manages the **testimonial** content collection (client quotes on the website) from the admin
portal, built entirely from the shared UI kit (P7.C Stage 1). A **list-only** collection — no
slug, addressed by id.

## Surface

- **`/content/testimonials`** (`content.read`) → `TestimonialsPage`: a kit `DataTable` with a
  `featured` boolean filter, an **inline `featured` Switch** wired to the update mutation (W6,
  `content.manage`-gated), RBAC row Edit/Delete, and bulk delete.
- **Create/edit**: `TestimonialFormModal` (`content.testimonial.form`) → `DynamicFormModal`;
  translatable `quote`/`authorRole`/`companyDescriptor` per-locale under LocaleTabs (W6);
  `avatarMediaId` via the shared `MediaIdPickerField` (W5).
- **Delete**: shared mutation-aware `useConfirm` + toast (single + bulk).

## Contracts (`@sanad/contracts`)

- `TestimonialItem` (read), `TestimonialCreateRequest` / `TestimonialUpdateRequest`
  (`Omit<…,'id'>` PATCH body, partial — used by the inline featured toggle),
  `TestimonialListQuery` (`featured` filter via `booleanParamSchema`).
- Local form shape: `testimonialFormSchema` (`schema/`) — translatable fields nested under
  `translations`; `rating` is '' (none) or 1–5; coerced numbers.

## Endpoints (pre-existing — no Postman drift)

`GET /content/testimonials` · `POST` · `PATCH /:id` · `DELETE /:id` (writes `content.manage`).

## Events

Publishes `content.testimonial.changed` after each successful mutation (W4).

## Permissions

`content.read` (view) · `content.manage` (create/edit/delete + the featured toggle + row/bulk
actions).
