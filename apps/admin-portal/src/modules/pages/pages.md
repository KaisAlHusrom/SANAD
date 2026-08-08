# pages (admin module)

The website **Content Studio** (P7.C Stage 4 → P8.5 Phase 4b) — a **preview-first** `page → section →
block` editor: the whole page renders as a live editable canvas (edited in place) with a slide-in
structural rail for add/reorder/hide/delete/config/blocks. Section **copy** is edited inline on the
canvas (no form); **blocks** still use the kit's typed `BLOCK_FORM_MODAL` (`useDynamicForm` +
`DynamicFormFields`, `LocaleTabs`, `MediaIdPickerField`, the Quill `RichTextEditor`), and the shared
`SortableList`, `Sheet`, modal registry, toast, confirm.

## Purpose & IA

One sidebar entry → the content hub → a **Pages** card.

- `/content/pages` — the **pages list** (draft-visible admin list, `DataTable`): title / slug /
  status `Badge` / updated. Drag-reorder; create/edit page **meta** via the `PAGE_FORM_MODAL`; row
  actions **Open builder** / Edit details / Delete (+ bulk delete).
- `/content/pages/:id` — the **preview-first Studio** (P8.5 Content Studio, Phase 4b): the whole page
  IS the editor.
  - **Studio canvas** (`components/studio-canvas.tsx`) — the WHOLE page rendered by the SHARED
    `@sanad/web-ui` `SectionRenderer`/`SectionBlock` in `mode='edit'`, wrapped in one website-dark
    `WebsiteShell` + one page-scope `EditProvider`. Every heading/paragraph/image is edited **in
    place** (the `Editable*` primitives); a toolbar carries the locale + desktop/mobile toggles, a
    glowing "live" dot, the page title, a `sanad.tech/<slug>` caption, and the **Structure** button.
    Each section sits in a transparent focus wrapper (outline-only, no layout box) so rail selection
    scrolls it into view and clicking it focuses it in the rail (bidirectional).
  - **Structure rail** (`components/structure-rail.tsx`) — a **non-modal** slide-in `Sheet` (the
    canvas stays live behind it) holding everything that isn't inline copy/image editing, as a
    **master → detail** drill-down: the OUTLINE lists the sections (drag-reorder, `+ section`, W6
    visibility eye, delete, click-to-focus); drilling into one shows ITS `SectionConfigPanel` +
    `BlockList` (the typed `BLOCK_FORM_MODAL`). Copy is edited on the canvas, not in a form.
    **Dismissal (2026-07-19 fix).** Because the rail runs `modal={false}` it renders **no overlay**, and
    it deliberately prevents outside-click dismissal (`onInteractOutside`/`onPointerDownOutside`) so the
    owner can edit canvas copy with the rail open — which left Esc as the only (invisible) way out, i.e.
    the rail could not be closed. A `RailClose` icon button (lucide `X`, label `rail.close`, ar+en) now
    sits at the inline-end of **both** the outline and detail `SheetHeader`s and calls
    `onOpenChange(false)` on the controlled `railOpen` state. The detail header's back arrow is NOT a
    close — it only returns to the outline (`onSelectDetail(null)`), so both affordances coexist.
  - A single **`detailId`** (in `page-builder-page.tsx`) drives BOTH the canvas focus/scroll and the
    rail's detail view, so the two stay in sync. `usePageBuilder` owns the section/block mutations
    (`addSection` returns the new id so the rail drills into it); selection lives in the page.

All routes are `content.read`-gated; writes are `content.manage`.

## Preview-first canvas = the shared renderer (the P8 seam, realized)

The canvas renders the page via **`@sanad/web-ui`** (`WebsiteShell` + `SectionRenderer`/`SectionBlock`,
`mode='edit'` for `content.manage`, else `mode='preview'`) — the **same** components the public website
(P8) uses with `mode='live'`, so a section's visual is byte-identical (preview === live); the data
contract (`SectionNode`/`BlockNode`) is the bond. The `WebsiteShell` scope (`.sanad-web`) renders the
website's fixed-dark theme regardless of the admin's light/dark state. Inline commits go through the
**page-scope** seam (`usePageInlineCommit` in `hooks/use-inline-commit.ts`) — an edit's target section
is resolved from the tree by the path's `sectionId`, then `buildInlineUpsert` merges the change
(preserving the other locale + siblings); `upsertSection`/`upsertBlock` patch the cache optimistically
and publish `content.page.changed` on commit (blur/save). See `libs/web/ui/web-ui.md`.

## Typed block editor (U21 owner decision)

`schema/block-data.ts` defines, per block type, the non-translatable `data` keys + a Zod schema +
flatten/collect helpers (pure, unit-tested): `stat → value/suffix`, `cta → href/variant`,
`feature/step → icon`; `text/richtext` carry only translatable copy (body = Quill for `richtext`,
textarea for `text`/`step`/`feature`); `feature/image` carry an `imageMediaId`. Data fields are kept
**flat** in the form (the kit's `buildDefaultValues` keys by name, so a `data.x` path can't nest) and
pivoted into the contract's `data` object on submit (`toBlockData`).

## Section collection panel (P8.5 Content Studio, Phase 3)

A collection-backed section (**`services`** → services; **`trust`** → the portfolio "domain
constellation"; **`work`** → the portfolio WEB10 case-study orbit; **`testimonials`** → the
testimonials wall; **`blog`** → the blog teaser; **`faq`** → the FAQ accordion; **`team`** → the
About roster — the last two added in Phase 5) shows a **collection link panel**
(`components/section-config-panel.tsx`) in the **rail's section detail** (above its blocks list) —
gated on `content.manage`, rendered only for types in `COLLECTION_SECTIONS` (`hooks/use-section-config.ts`). It
edits `section.config` (`SectionCollectionConfig`): a **mode** Select (its collection's valid modes),
a **limit**, and — for `picked` — a **`ServerSelect`** over the records (W5), plus a **"Manage
{collection} →"** deep-link. The picked `ServerSelect` uses the lookup named by the meta's
`pickedCollection` (`data/lookups/{service,portfolio,testimonials,blog,faq,team-member}-lookup.api.ts`)
— each a read-only bridge with its own `reducerPath`, all eagerly registered in
`data/store/register-apis.ts` (the `faq` lookup is new; `team` reuses the existing
`team-member-lookup.api`). Labels come from the item: services/portfolio/blog/**faq**(`question`)/
**team**(`name`) use `pickLocalized`, **testimonials use `authorName`** (no title). **`trust` is
`all`-only** (breadth of categories) → mode + limit, no ids picker; **`services`** offers `all` +
`picked` → `/content/services`; **`work`** and **`testimonials`** offer `featured`/`picked`/`all`
(curated showcases) → `/content/portfolio` / `/content/testimonials`; **`blog`** offers `picked`/`all`
(no featured flag) → `/content/blog`; **`faq`** offers `all`/`picked` → `/content/faqs`; **`team`**
offers `featured`/`picked`/`all` → `/content/team` (team avatars are collected into the studio media
resolver so they render in the preview, preview===live).
Saving builds a FULL section upsert carrying the new `config` while threading the section's copy
through unchanged (`buildConfigUpsertBody`, pure/unit-tested), so it never wipes the editorial copy;
`upsertSection` merges `config` into the cached tree optimistically, then the `PageTree` refetch
re-hydrates `collection` so the preview updates (preview===live). The content-service hydrates the
linked records in-service — see `content-service.md`.

## Admin media resolver — covers in the preview (P8.5, the works swap)

The Studio canvas (`components/studio-canvas.tsx`) renders the shared `@sanad/web-ui` `SectionRenderer`
— which resolves each section's covers / `image` blocks through an injected `resolveImageUrl(id) → url`
seam. `hooks/use-section-media-resolver.ts` supplies it: `collectSectionMediaIds(section)` (pure/
unit-tested — block `imageMediaId` + hydrated collection `coverMediaId` for portfolio/services/blog,
**`avatarMediaId` for testimonials**) → the shared `mediaLookupApi.resolvePublicMedia` bridge
(`GET /media/public?ids=`, the same batch the website uses, W5) → a synchronous closure. The canvas
renders the WHOLE page at once, so it uses the **page-scope** `usePageMediaResolver(sections)` (the ids
of EVERY section, deduped, batch-resolved in ONE call), feeding the same closure to `SectionRenderer`,
so the `work` orbit covers, blog log covers, testimonial author photos (and any `image` block) show
across the page (preview===live). Unresolved ids (dev unconfigured storage) fall back to the built-in
placeholder frame (F3).

**Editing imagery in the studio (Phase 4a — `EditContext.onPickImage` + `onEditRecord`).** In `edit`
mode the canvas injects two media affordances on top of the display seam:

- **`image` blocks → inline media picker.** The shared `EditableImage` primitive (mounted only in
  `edit`) shows a corner "change image" button that calls `EditContext.onPickImage(path)` with a new
  `block-image` field path. `hooks/use-studio-image-picker.ts` opens the shared, image-filtered
  `MediaLibraryModal` — the full media explorer, so a Studio image gets the same folders, search
  and upload as everywhere else (`media.read`-gated → no affordance without it) — and, on pick,
  commits the asset **id** to the block's `imageMediaId` via
  `buildInlineUpsert`'s `block-image` branch (empty clears it) — the `upsertBlock` cache already
  patches `imageMediaId` optimistically, so the preview updates instantly.
- **Collection covers → deep-link to the record.** A work cover / testimonial avatar / blog cover is
  NOT page-tree data (it lives on its own table), so it can't be inline-committed. The shared
  `RecordEditFrame` (mounted only in `edit`) wraps each card with a corner "edit record" button that
  calls `EditContext.onEditRecord(collection, id)`; `hooks/use-edit-record-nav.ts` routes to that
  record's editor — blog's route (`/content/blog/:id/edit`), or the `?edit=<id>` deep-link the
  portfolio/testimonials list pages read (`hooks/use-edit-query-param.ts`) to open their edit modal.

The lib stays `type:ui` (route/data-free): both callbacks are injected by the admin.

## Entities & contracts (from `@sanad/contracts` — verified, U15)

- **`PageTree`** (read) — `slug`, `status`, `title`/`metaTitle`/`metaDescription` (`LocalizedText`),
  `sections: SectionNode[]`; **`PageSummary`** is the list row (no tree).
- **`SectionNode`** — `type` (`SectionType` enum), `published`, eyebrow/title/subtitle, `blocks`,
  **`config`** (`SectionCollectionConfig | null` — the collection link) + **`collection`**
  (`HydratedCollection | null` — the linked records, hydrated in-service; Phase 3).
- **`BlockNode`** — `type` (`BlockType` enum), `data: Record<string, unknown>`, `imageMediaId`,
  title/body.
- **Writes** — `PageUpsertRequest`, `SectionUpsertRequest`, `BlockUpsertRequest` (all upserts: `id`
  present = update). Ordering is owned by the reorder routes, not a form field.

## API (W3) — `api/pages.api.ts`

- `listPages` `GET /content/pages` · `getPageTree` `GET /content/pages/:id/tree` (**draft-visible
  admin tree** — the new backend route; the public `/pages/:slug` hides drafts).
- `upsertPage` `POST /content/pages` · `deletePage` `DELETE /content/pages/:id` · `reorderPages`
  `PATCH /content/pages/reorder`.
- `upsertSection`/`deleteSection`/`reorderSections` (`/content/sections[...]`),
  `upsertBlock`/`deleteBlock`/`reorderBlocks` (`/content/blocks[...]`). Section/block mutations carry
  the owning `pageId` so the tree query re-fetches; every write publishes **`content.page.changed`**
  (W4).

## Shared additions

- **`components/ui/sheet.tsx`** (`Sheet` + `SheetContent`/`Header`/`Body`/`Footer`) — a reusable
  slide-in side panel on Radix Dialog (the 07-plan Wave-3 Drawer/Sheet), docked to a **logical** edge
  (`inline-end`/`inline-start`, RTL-safe) with a `modal` prop; **non-modal** = no dimming overlay so
  the surface behind stays interactive. The slide-in is a `[dir]`-keyed keyframe in `global.css`
  (enter-only → never sits off-screen contributing horizontal overflow). Powers the Structure rail.
- **`components/sortable/`** (`SortableList` + `DragHandle`) — a generic optimistic drag-reorder
  list (the bespoke-tree analog of the DataTable's row reorder), reused by the rail's section outline,
  the blocks list, and the menus editor.

## Tests

`block-data.spec` (typed schema + pivot), `pages-page.spec` (list + RBAC), `page-builder-page.spec`
(loads the draft tree → the preview-first canvas; opens the structural rail), `studio-canvas.spec`
(whole-page render, Structure button, section focus, edit-affordance gating), `structure-rail.spec`
(outline drill/visibility, section-detail back/delete), `sheet.spec` (side/modal variants),
`use-inline-commit.spec` (incl. page-scope `buildPageInlineUpsert`).
