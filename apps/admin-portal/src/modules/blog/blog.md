# blog (admin module)

Website **blog** management — the most relational content vertical (P7.C Stage 3). Built entirely
from the shared kit (DataTable + DynamicForm + ServerSelect + modal registry + toast + confirm),
plus the new shared **rich-text editor** primitive for the post body.

## Purpose & IA

One sidebar entry → the content hub → a **Blog** card. The IA mirrors portfolio's sub-page pattern,
extended to two taxonomies:

- `/content/blog` — **posts** table (draft-visible admin list). Inline draft↔published Switch (W6),
  status toolbar filter, status `Badge`, row Edit/Delete + bulk delete. Two links in the header:
  **Manage categories** → `/content/blog/categories`, **Manage tags** → `/content/blog/tags`.
- `/content/blog/categories` — **categories** sub-page (DataTable + form modal + Back-to-posts).
- `/content/blog/tags` — **tags** sub-page (DataTable + form modal + Back-to-posts).

All routes are `content.read`-gated; writes (the form modals + inline toggle) are `content.manage`.

## Editor page, reorder & slug (this session)

- **Dedicated post create/edit PAGE** — posts no longer use the shared DynamicForm modal. New posts
  open at `/content/blog/new`, edits at `/content/blog/:id/edit` (the editor fetches by id via
  `GET /content/blog/manage/:id`, drafts visible). The page has an **unsaved-changes guard**
  (`use-unsaved-guard` — blocks navigation/close while dirty) and **localStorage draft autosave**
  (`use-post-draft` — restores an in-progress draft after an accidental reload).
- **Drag-and-drop reorder** — the categories + tags sub-pages drop the `sortOrder` number field and
  instead reorder by dragging rows (the DataTable `reorder` prop → `PATCH /content/blog-<x>/reorder`
  with the new id order). The posts table likewise reorders by drag.
- **Auto-slug** — slug fields auto-generate from the title via the `slug` dynamic-form field type
  (`SlugField`), Arabic→latin transliteration through `lib/slugify`; editable, but stays in sync
  with the title until manually overridden.

## Entities & contracts (from `@sanad/contracts` — verified, U15)

- **`BlogPostItem`** (read) embeds `category`/`author` (`BlogEntityRef | null`) + `tags`
  (`BlogEntityRef[]`); translatable `title`/`excerpt`/`body` are `LocalizedText`. No `featured`
  field (the only inline toggle is `status`).
- **Write** (`BlogPostCreateRequest`/`BlogPostUpdateRequest`): flat `categoryId`,
  `authorTeamMemberId` (a content **team member**, not an identity user), `tagIds: uuid[]` (M2M),
  `coverMediaId`, `status`, `readMinutes`, `sortOrder`, + the `{ar,en}` translatable fields.
  `publishedAt` is server-managed.
- **`BlogCategoryItem`** (translatable `name` + `description`), **`BlogTagItem`** (translatable
  `name`).

The form schemas (`schema/*.zod.types.ts`) are **form-shaped** (translatable fields under a
`translations` map; ids `'' | uuid`; coerced numbers); the `localized-form` helpers pivot to/from
the contract `{ar,en}` shape. `BLOG_NULLABLE_KEYS` map an empty selection to `null` in the body.

## Gateway endpoints consumed

Posts `GET /content/blog/manage` · `POST /content/blog` · `PATCH|DELETE /content/blog/:id`.
Categories `GET /content/blog-categories` + POST/PATCH/DELETE. Tags `GET /content/blog-tags` +
POST/PATCH/DELETE. (All pre-existing P5 B4 routes — no gateway change, no Postman drift.)

## W5 lookups (decoupled pickers — never another module's api)

- `data/lookups/blog-category-lookup.api.ts` → single-select category ServerSelect.
- `data/lookups/blog-tag-lookup.api.ts` → **multi**-select tags ServerSelect (chips + "+N more").
- `data/lookups/team-member-lookup.api.ts` → single-select author ServerSelect (`GET /content/team`).

Each searches server-side and resolves selected ids by filtering a bounded page (the folder-lookup
pattern — there is no by-id route).

## Rich-text body

The translatable `body` is a `custom` DynamicForm field rendering the shared
`components/rich-text` `RichTextEditor` (Quill snow, tokens-only, RTL-aware) per locale under the
LocaleTabs. The editor stores HTML; the website sanitises on render (P8).

## Events emitted (client event bus, W4)

`content.blog.changed`, `content.blog-category.changed`, `content.blog-tag.changed` — published by
each mutation's `onQueryStarted`; the post form's category/tag/author pickers refetch on taxonomy
changes.

## Settings used

None directly (content, not config).
