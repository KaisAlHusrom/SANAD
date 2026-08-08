# portfolio (admin module)

Manages the **portfolio** content domain — case-study **projects** and their **categories** (the
website "work" section) — from the admin portal. The first content domain with a `ServerSelect`
(project → category), draft/published status, and a two-entity sub-page IA. Built entirely from
the shared UI kit (DataTable + DynamicFormModal + ConfirmationModal + toast + modal registry) — no
bespoke table/form/dialog (P7.C Stage 2).

## Surface (IA)

- **`/content/portfolio`** (`content.read`) → `PortfolioPage`: a kit `DataTable` over the
  **draft-visible admin list** `GET /content/portfolio/manage` (search, `status`/`featured`
  filters, pagination, RBAC-gated row Edit/Delete + bulk delete). **Inline toggles (W6):** a
  draft↔published `Switch` (PATCHes `{ status }`) + a featured `Switch` (PATCHes `{ featured }`),
  both `content.manage`-gated. A **"Manage categories"** link opens the sub-page.
- **`/content/portfolio/categories`** (`content.read`) → `PortfolioCategoriesPage`: the project
  taxonomy as a kit `DataTable`; a "Back to projects" link returns.
- **Create/edit project**: `PortfolioFormModal` (`content.portfolio.form`) → a `DynamicFormModal`
  whose translatable `title`/`summary`/`challenge`/`solution`/`result` edit per-locale under
  LocaleTabs (W6). `categoryId` is picked with a **`ServerSelect`** bridged via the shared
  `portfolio-category-lookup.api` (W5 — never this module's api); `coverMediaId` with the shared
  `MediaIdPickerField` (W5); `status` is a draft/published select.
- **Create/edit category**: `PortfolioCategoryFormModal` (`content.portfolio-category.form`).
- **Delete**: the shared mutation-aware `useConfirm` + toast (single + bulk, both entities).

## Contracts (`@sanad/contracts`)

- Projects: `PortfolioProjectItem` (embeds `category` + `status`/`publishedAt`),
  `PortfolioCreateRequest` / `PortfolioUpdateRequest` (`Omit<…,'id'>` PATCH body),
  `PortfolioListQuery` (`status`/`featured`/`categoryId` filters), `portfolioStatusSchema`.
- Categories: `PortfolioCategoryItem`, `PortfolioCategory{Create,Update}Request`,
  `PortfolioCategoryListQuery`.
- Local form shapes: `portfolioFormSchema` + `portfolioCategoryFormSchema` — the contracts with
  translatable fields nested under `translations` (kit convention), coerced numbers, and
  `categoryId`/`coverMediaId` as '' (none) or a uuid. The `localized-form` helpers pivot entity ↔
  form ↔ upsert body (the project record also maps the embedded `category.id` → flat `categoryId`).

## Lookup (W5)

`data/lookups/portfolio-category-lookup.api.ts` — a read-only bridge for the project form's
ServerSelect: `searchPortfolioCategoryLookup` (server-side `search`/`page` on
`GET /content/portfolio-categories`) + `getPortfolioCategoriesByIds` (resolves selected ids by
filtering a fetched page client-side — there is no by-id route; fine for a bounded set).

## Endpoints (gateway, all pre-existing — no Postman drift)

Projects: `GET /content/portfolio` (public, forces `status=published`) ·
`GET /content/portfolio/manage` (`content.read`, drafts) · `GET /content/portfolio/:slug` (public)
· `POST` · `PATCH /:id` · `DELETE /:id` (writes `content.manage`).
Categories: `GET /content/portfolio-categories` (public) · `POST` · `PATCH /:id` · `DELETE /:id`
(writes `content.manage`).

## Events

Publishes `content.portfolio.changed` and `content.portfolio-category.changed` on the client event
bus after each successful mutation (W4).

## Permissions

`content.read` (view both pages) · `content.manage` (create/edit/delete + the create buttons +
row/bulk actions + the inline status/featured toggles).
