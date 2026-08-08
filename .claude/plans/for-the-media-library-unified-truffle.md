# MediaExplorer — the file-explorer UI for the media library

## Context

The owner asked for the media library (and the picker that opens from any form) to work like a
**file explorer**: see folders and images together, open folders, and organize by drag-and-drop.
Today folder "selection" is a flat combobox and everything else is a single ungrouped grid.

This is **Stage 4** of the media rework. Stages 0–3 and 5 are **done, tested and live-verified**
in the previous session; this plan covers only what remains. What already exists — and what this
UI is built on:

**Backend (live, 77 media-service tests green, migration already run on the dev DB):**
- `GET /api/media/folders/tree` → `MediaFolderTree = { roots: MediaFolderNode[], rootAssetCount }`,
  where a node is a `MediaFolder` + `assetCount` (direct, not recursive) + `children[]`; siblings
  name-sorted, orphans rescued to the root.
- `PATCH /api/media/folders/:id` → rename and/or re-parent. `parentId` is **tri-state**: absent =
  keep, `null` = move to root, uuid = move under. 409 on a duplicate name (case-insensitive,
  per parent), 400 on a cycle, 404 unknown.
- `DELETE /api/media/folders/:id?strategy=block|reparent` → `block` (default) refuses a non-empty
  folder with a 409 whose params carry `{ name, assets, folders }`; `reparent` lifts contents up
  one level first. Assets are never destroyed.
- `PATCH /api/media/move` → `{ ids[1..200], folderId: uuid|null }` → `{ movedIds, missingIds }`.
- `GET /api/media` gained `status` and `folderId=root` (the `MEDIA_ROOT_FOLDER` sentinel = assets
  in **no** folder; omitting `folderId` still means "everywhere").
- Backend messages are localized keys (U24) — the gateway renders them, so a thrown error already
  arrives as Arabic/English prose in `ApiError.message`.

**Frontend (already built):** dialog stacking (`components/ui/dialog-stack.tsx` — depth z-index,
receding parent, `xl`/`full` sizes, `DialogStackHeader` breadcrumb + back, `DialogTitleProvider`);
the upload engine (`lib/run-media-upload.ts`, `lib/put-to-r2.ts` with a classified
`UploadTransportError`, `lib/classify-upload-error.ts`); toasts, `useConfirm`, `RenderGate`.

**Owner decisions for this stage:** picker opens **near-full-screen** (`full`); deleting a
non-empty folder **asks and offers "move contents up one level"**; search looks **everywhere**
with a hint.

**Governing rules:** U23 (every state ships), U21 (design/interaction finished to the canon),
F9 (reuse before create), U5 (logic in hooks), U7 (RTL/logical only), U6 (tokens only).

---

## Reuse — found during exploration, do NOT rebuild

| Need | Use this |
|---|---|
| In-app drag & drop | **`@dnd-kit/core` is already a dependency** (`components/sortable/sortable-list.tsx`, `data-table-sortable-row.tsx`). Use `DndContext` + `useDraggable`/`useDroppable` — keyboard-accessible and touch-capable, unlike hand-rolled HTML5 DnD. |
| Multi-select | `components/data-table/use-bulk-selection.ts` — **extend it** with `selectOnly(id)` + `selectRange(anchorId, id, orderedIds)` (it has toggle/toggleAll/clear but no click/shift semantics). Extending the shared hook, not forking it (F9). |
| Pagination | `components/data-table/pagination-range.ts` (`buildPaginationRange`, pure) |
| Render order | `components/feedback/render-gate.tsx` + `empty-state.tsx` / `error-state.tsx` / `skeleton.tsx` |
| Confirms | `data/confirm/use-confirm.ts` — `await confirm({ title, message, variant, confirmLabel, onConfirm })`; the single `ConfirmationRoot` renders it |
| Toasts | `data/toast` (`toast.success/error`) |
| Upload | `lib/run-media-upload.ts` + `classifyUploadError` / `formatUploadFailure` |
| Permissions | `app/guards/use-require-permission.ts` (`media.read` / `media.manage`) |
| Reads/writes | the shared bridges `data/lookups/media-lookup.api.ts`, `data/lookups/folder-lookup.api.ts`, `data/media-manage.api.ts` — **never** `modules/media/api` (W5) |

**Design canon (U21a).** There is no explorer screen in `Sanad Admin.dc.html`, so derive from its
media screen (lines 387–405) + `design-spec.md` §4: card `1px var(--border)` / radius 13px /
`bg surface` / hover `border-color: var(--border-2)`; thumb `aspect-ratio 1.3`; filename 12.5px
**`dir="ltr"`** (filenames stay LTR in an Arabic UI) with ellipsis; size 11px `--faint`; grid
`repeat(auto-fill, minmax(176px,1fr))` gap 16; a **dashed upload tile** as the first cell; header
row = "N files · M GB" + primary action. Tree pane derives from the shell sidebar: nav radius 9px,
active = `--accent-soft` bg + `--accent` fg + inset inline-end bar.

---

## Build

### 4a · Data layer (shared bridges only)

- `data/lookups/folder-lookup.api.ts` — add `getFolderTree: builder.query<MediaFolderTree, void>`
  (`GET /media/folders/tree`), tagged `{type:'FolderTree', id:'LIST'}`.
- `data/media-manage.api.ts` — add `updateFolder` (`PATCH /media/folders/:id`), `deleteFolder`
  (`DELETE …?strategy=`), `moveAssets` (`PATCH /media/move`). Each publishes a domain event on
  success and invalidates the tree tag.
- `data/events/domain-event.types.ts` — add `{ type:'media.folder.changed' }` and
  `{ type:'media.assets.moved'; folderId: string|null }` to the union; both surfaces subscribe
  via `useEventBus` (W4/F5), since the read and write bridges have different `reducerPath`s.
- `modules/media/api/media.api.ts` keeps re-exporting the write hooks so module call sites don't
  change their import paths (the existing pattern).

### 4b · `use-media-explorer.ts` — the engine (U5)

One hook owning: `folderId` (undefined = root sentinel view), expanded-node set, `view: 'grid'|'list'`,
search (debounced via the existing `hooks/use-debounced-value.ts`), type filter, page, and selection.

- **Root semantics:** the tree's top node is the library root and lists assets with **no folder**
  (`folderId = MEDIA_ROOT_FOLDER`), exactly like Explorer. Opening a folder sets its uuid.
- **Search is global** (owner's choice): a non-empty term **omits `folderId`** from the query and
  the results header shows "searching everywhere — clear to return to «folder»".
- **Breadcrumb path** is derived from the tree by walking `parentId` upward — no extra request.
- Selection: extended `useBulkSelection` (click = `selectOnly`, ⌘/ctrl = `toggle`, shift =
  `selectRange` over the current ordered ids). Clears on folder change and after a successful move.
- Mode: `'page' | 'picker'`. `page` syncs folder/view/search to the URL through the existing
  `hooks/use-list-url-state.ts`; `picker` keeps state local (a modal must not rewrite the page URL).

### 4c · `use-explorer-dnd.ts` — organizing by drag

**Two mechanisms, deliberately:**
1. **In-app drags → `@dnd-kit/core`.** Draggables: asset tiles/rows (selection-aware — dragging a
   selected item drags the whole selection) and tree nodes. Droppables: tree nodes, breadcrumb
   crumbs, folder tiles in the grid, and the pane background (→ current folder). A `DragOverlay`
   shows "N files" while dragging.
2. **OS file drops → native handlers.** Dragging files from Finder/Explorer is a browser-native
   event that dnd-kit does not see; keep `onDragOver`/`onDrop` reading `dataTransfer.files` (the
   pattern already in `media-library-modal.tsx`) on the content pane. The two coexist because
   dnd-kit only intercepts pointer events on its own draggables.

**Validity is computed before the drop** (pure + unit-tested): reject dropping onto the folder an
item already lives in, onto itself, or a folder into its own descendant (mirrors the backend's
cycle guard so the user gets an instant "can't drop here" cursor instead of a round-trip 400).

**Optimistic + reconciled:** a move patches the list/tree caches immediately, then reconciles from
`{ movedIds, missingIds }` and **rolls back with an error toast** on failure. `missingIds` are
reported, never silently dropped.

### 4d · `use-upload-queue.ts` + `upload-tray.tsx`

Replaces the single `isUploading` boolean with a real queue: `queued → uploading(%) → confirming →
done | failed(reason, retry)`, driving a compact tray docked at the bottom of the content pane
(collapsible, shows "3 of 5 uploaded", per-file rows with progress, per-file retry, "retry all").

To get a **real** percentage, `lib/put-to-r2.ts` swaps `fetch` for `XMLHttpRequest` with
`upload.onprogress` (fetch cannot report upload progress). The existing error classification is
preserved exactly — a CORS/network failure still produces `UploadTransportError{kind:'cors'|'network'}`
and an HTTP failure still parses R2's XML `<Code>/<Message>`; `put-to-r2.spec.ts` is updated to
drive the XHR mock and keeps all its current assertions.

### 4e · Components (`apps/admin-portal/src/components/media-explorer/`)

`media-explorer.tsx` (two-pane shell + DndContext) · `folder-tree.tsx` + `folder-tree-node.tsx`
(expand/collapse, per-node count, inline rename, droppable, draggable) · `folder-node-menu.tsx`
(new subfolder / rename / delete, on the existing `dropdown-menu`) · `explorer-breadcrumbs.tsx`
(droppable crumbs) · `explorer-toolbar.tsx` (search, type filter, grid⇄list, new folder, upload) ·
`asset-grid-view.tsx` (canon card + the dashed upload tile) · `asset-list-view.tsx` (name/type/size/
date rows) · `selection-bar.tsx` (N selected → Move to…, Delete, Clear) · `upload-tray.tsx` ·
`media-explorer.constants.ts` (page size, grid min column width, tray limits — U18).

Wiring: `<MediaExplorer mode="page">` replaces the body of `modules/media/components/media-page.tsx`
(the page keeps its own header, F10); `<MediaExplorer mode="picker">` replaces the body of
`components/media-picker/media-library-modal.tsx`, which moves to `size="full"` and keeps its
`DialogStackHeader` + select→confirm footer. **Retired:** `folder-filter.tsx`,
`media-grid.tsx`/`media-card.tsx`, `media-thumbnail-grid.tsx`, and the `MediaFolderSelect` usage
(the component itself stays — other forms may still use it).

**Folder delete (owner's choice):** if the folder is non-empty, the confirm dialog names what is
inside and its primary action is **"Move contents up one level & delete"** → `strategy=reparent`;
an empty folder deletes directly with `strategy=block`.

### 4f · Every state (U23) — enumerated before the code

Tree: loading skeleton · error + retry · no folders yet · deep nesting · very long names ·
read-only (no `media.manage`).
Content: loading skeleton (canon-shaped tiles) · error + retry · **empty folder** vs **no search
results** vs **first-use, nothing uploaded ever** (three different messages and next actions) ·
storage-unconfigured (503, links to Integrations) · no `media.read` (nothing renders).
Interaction: drag-over target highlight · invalid-drop cursor + reason · optimistic move + rollback
toast · rename in progress / rename conflict (409 inline on the field) · delete blocked · selection
count · upload queued/uploading %/confirming/failed + retry · asset still `pending` badge.
Permissions: without `media.manage` the explorer is read-only — upload, new-folder, rename, delete
and drag are disabled **with a reason shown**, never silently missing (U23c).
Locales: ar (RTL, default) + en, key parity; filenames `dir="ltr"` in both.

i18n: a new **`mediaExplorer`** namespace at `src/i18n/media-explorer/{ar,en}.json` + `index.ts`
calling `registerCatalog('mediaExplorer', ar, en)`, imported eagerly from `src/i18n/index.ts` —
the same pattern as `src/i18n/ui-kit/` (F13). One namespace serves both surfaces.

---

## Verification

1. **Unit (TDD1, test-first per unit):** drop-validity (self / same-folder / descendant-cycle) ·
   breadcrumb path derivation from the tree · selection click/⌘/shift semantics · upload-queue
   transitions incl. failure + retry · optimistic-move reconcile with `missingIds` · i18n ar/en
   parity (`src/i18n/parity.spec.ts` covers new namespaces).
2. **Component:** explorer renders each state from §4f with a stubbed fetch — especially the three
   distinct empty states, the read-only mode, and a failed upload showing a named cause + retry.
3. **Suites:** `npx vitest run` in `apps/admin-portal` (448 currently green) + `npx tsc -p
   tsconfig.app.json --noEmit` + `npx eslint` on the new files. Then the **`verifier`** agent with
   the Docker stack **down** (OPS5) — it must PASS.
4. **Live, through nginx** (`http://localhost:8190/admin/`): create a nested folder, rename it,
   drag an image into it, drag it back to the root, multi-select 3 and drag them together, try an
   invalid drop, delete a non-empty folder via "move contents up", and drop OS files onto the pane
   to upload. Confirm the DB reflects each (`docker exec … psql -d media`).
5. **Verify by looking (U21e/U23d)** — Playwright + system Chrome, screenshots in **ar and en** of:
   the page explorer, the picker over the New-Project form (receded parent + breadcrumb + full
   size), tree loading, each empty state, drag-over, invalid drop, upload tray mid-flight, and a
   failed upload. Assert `scrollWidth === clientWidth` on each (no RTL overflow).
6. **`boot-verifier`** with the stack up.

## Notes

- A **concurrent session** recently landed U24 + `libs/shared/i18n` in this repo. Its last write
  was ~90 min before this plan and all apps typecheck clean, but if it resumes, re-check
  `apps/admin-portal/src/i18n/*` and the media-service storage files before editing them.
- Uploads still need the R2 **CORS** fix to actually succeed end-to-end: the owner is minting an
  "Admin Read & Write" R2 token so the built-in one-click **Configure CORS** button can run. Until
  then the explorer's upload path will correctly surface the classified CORS failure — which is
  itself one of the states to verify in §5.
