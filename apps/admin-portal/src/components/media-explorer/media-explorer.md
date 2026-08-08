# media-explorer (admin-portal, app-shared)

A **file explorer** for the media library: folders on the inline-start side, their contents beside
them, and drag-and-drop between the two. One component serves BOTH the Media page and the picker
modal any form opens, so organizing files works identically wherever the user meets the library
(F9). Built 2026-07-20 on the owner's report that "the way we select a folder" was a flat combobox
and files could not be organized at all.

It lives in `src/components/` — not in `modules/media/` — because a shared component may not
import a feature module (W5), and the picker is a shared component.

## Files

### Engine (U5 — no logic in a component)

- `use-media-explorer.ts` — THE engine: permissions, the folder tree, the asset list, the
  selection, the empty-kind decision, and the sub-hooks below. Two behaviours worth stating:
  - **the root is a place** — `folderId === null` lists the assets in NO folder (`folderId=root`
    on the wire), as a file manager's top level does, not "everything everywhere";
  - **search leaves the folder** — a term drops `folderId` and searches the whole library, and the
    UI says so, because someone searching has stopped caring where they filed it.
- `use-explorer-nav-state.ts` — folder / view / type / search / page. On the **page** it mirrors
  them into the URL with `replace` (a shared link reopens the same folder; Back still leaves the
  page instead of undoing a dozen folder clicks). In the **picker** it stays local — a modal must
  not rewrite the URL of the form behind it.
- `use-explorer-dnd.ts` — `@dnd-kit/core` wiring: draggable tiles/rows/tree nodes, droppable tree
  nodes, breadcrumb crumbs and folder tiles. Dragging a tile that is part of the selection moves
  the WHOLE selection. Legality is decided **while hovering**, so an illegal target never lights up
  and the overlay says why, instead of the server answering 400 after the release.
- `use-explorer-move.ts` — the bulk move. Moved files leave the current folder immediately
  (`movingIds`) and come back if the request fails; `missingIds` are reported, never folded into
  the success count.
- `use-folder-actions.ts` — create / rename / delete. Rename **returns** its error so a 409 lands
  on the field the user is still typing in. Delete confirms first: an empty folder is deleted with
  `strategy=block`; a non-empty one names what is inside and its primary action is _"Move contents
  up & delete"_ (`strategy=reparent`) — no file is ever destroyed by deleting a folder.
- `use-upload-queue.ts` — many files, one at a time, each with its own visible life:
  `queued → uploading(%) → confirming → done | failed(reason, retry)`. One summary toast per batch,
  not one per file.
- `use-inline-rename.ts` — inline folder rename, shared by the grid tile and the list row so a
  folder renames the same way in both (a 409 lands on the field, not in a vanishing toast).

### Pure units (unit-tested, no React)

- `explorer-tree.ts` — `findFolderPath` (the breadcrumb, derived from the tree already in hand),
  `findFolderNode`, `collectDescendantIds`, `countFolders`.
- `explorer-drop.ts` — `evaluateDrop(payload, target, roots)` → ok, or `sameFolder | self |
descendant`. Mirrors the service's cycle guard so the "no" is felt before the drop.
- `media-explorer.constants.ts` — page size, sort field, skeleton counts, tree indent, the MIME
  filter options (U18).

### Components

`media-explorer.tsx` (two-pane shell, `DndContext`, the **native** OS-file drop target,
pagination, drag overlay, the three empty states, and the full-screen preview) ·
`folder-tree.tsx` + `folder-tree-node.tsx` (expand/collapse, per-node count, inline rename, node
menu, droppable + draggable) · `explorer-breadcrumbs.tsx` (crumbs are drop targets — how a file
leaves a subfolder) · `explorer-toolbar.tsx` (search, type filter, grid⇄list, new folder, upload) ·
`asset-grid-view.tsx` (ONE grid: subfolders then files, the **same** card size) + `asset-tile.tsx`
(the design-canon card: 1px border, card radius, 1.3 thumbnail, `dir="ltr"` filename, size in
`--faint`) · `folder-tile.tsx` (the same card, a folder icon on the thumbnail plate — folders and
files line up in one even wall) · `asset-list-view.tsx` (name / size / modified) ·
`asset-context-menu.tsx` + `folder-context-menu.tsx` (the right-click menus, on `ui/context-menu`)
· `asset-preview.tsx` (the full-screen lightbox) · `selection-bar.tsx` · `upload-tray.tsx`.

## Click, right-click, double-click (owner, 2026-07-25)

- **Plain click** on a file OPENS it full-screen (`asset-preview.tsx`) — it does not select it.
  A file manager shows you the file; selecting for a bulk action is the modified click below.
- **⌘/Ctrl-click** toggles selection; **Shift-click** extends a range (the shared
  `use-bulk-selection` semantics). The selection count + bulk Move/Delete live in `selection-bar`.
- **Right-click** opens the item's menu: a file offers Preview / Download / Delete; a folder offers
  Open / New subfolder / Rename / Delete. Write actions appear only for a manager (U23c) — the same
  rule the sidebar tree's "⋯" menu follows, so an item behaves the same wherever it is shown.
- **Double-click** a file is the picker's "take this one" shortcut. In the picker the preview also
  carries a **"Use this image"** button, so choosing means seeing the file large first; there is no
  dead footer Select button waiting on a selection a click no longer makes.
- Upload is the toolbar's job — the old dashed "upload tile" wedged into the grid (a mismatched
  size next to the real tiles) was removed.

## Two drag mechanisms, deliberately

1. **In-app drags → `@dnd-kit/core`** (already a dependency; keyboard- and touch-capable, unlike
   hand-rolled HTML5 DnD).
2. **OS file drops → native `dragover`/`drop`** reading `dataTransfer.files`. dnd-kit cannot see a
   drag that originates outside the page; the two coexist because dnd-kit only claims pointer
   events on its own draggables.

## Data

Reads: `folderLookupApi.getFolderTree` (`GET /media/folders/tree`) and
`mediaLookupApi.searchMediaLookup` (`GET /media`). Writes: the `mediaManageApi` bridge
(`updateFolder`, `deleteFolder`, `moveAssets`, `deleteAsset`, sign/confirm upload, `createFolder`).
The three live in different `reducerPath`s, so refresh rides the client event bus (W4):
`media.asset.uploaded`, `media.asset.deleted`, `media.assets.moved`, `media.folder.created`,
`media.folder.changed`.

## i18n

`src/i18n/media-explorer/{ar,en}.json`, registered eagerly as the app-shared **`mediaExplorer`**
namespace (F13) — one catalog for both surfaces. Arabic is the default; filenames render
`dir="ltr"` in both locales because a filename is an identifier, not prose.

## States (U23 — every one is built and tested)

Tree: skeleton · error + retry · no folders yet · deep nesting · long names · read-only.
Content: skeleton · error + retry · **three distinct empties** (first-use library / empty folder /
no search results, each with its own next action) · storage-unconfigured (503) · no `media.read`
(nothing renders, and the reason is stated).
Interaction: valid-drop highlight · invalid drop with its reason in the overlay · files leaving on
a move and returning on failure · rename in progress / rename conflict inline · delete blocked or
reparented · selection count · upload queued/uploading %/confirming/failed + retry · a still
`pending` asset badged rather than shown as a broken image.
Permissions: without `media.manage` the explorer is read-only and **says so** — actions are never
silently absent (U23c).

## Tests

- `explorer-tree.spec.ts` (9) — breadcrumb derivation, descendants, counts, and a folder that has
  gone.
- `explorer-drop.spec.ts` (9) — same-folder, self, and the descendant cycle, for files and folders.
- `use-upload-queue.spec.tsx` (9) — a whole drop finishing, the destination folder, a blocked
  upload naming CORS with no false retry, retry + retryAll succeeding, ONE toast per batch,
  dismiss/clear.
- `media-explorer.spec.tsx` — one test per state above, plus: a plain click opening the preview
  (not a selection), ⌘/Ctrl-click selecting, the right-click Delete menu, the removed upload tile,
  list view, and walking into a folder and back out through the breadcrumb.
- `use-bulk-selection.spec.ts` — the file-manager click semantics (plain / ⌘ / shift) added to the
  shared hook for this surface.
