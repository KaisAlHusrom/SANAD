# media module (admin-portal)

The media library route. Since the explorer rework (2026-07-20) this module is **only its route
and its own catalog** — the whole library UI lives in the app-shared
`src/components/media-explorer/` (see `media-explorer.md`), because the identical surface opens
inside the picker modal that any form can raise, and a shared component may not depend on a
feature module (W5/F9).

## Files

- `components/media-page.tsx` — the route: an `<h1>` + subtitle over `<MediaExplorer mode="page" />`.
- `i18n/{ar,en}.json` — the `media` catalog (title/subtitle only; every other string in the library
  belongs to the app-shared `mediaExplorer` catalog). Parity-checked (U8), registered at import.

There is no `api/`, no `hooks/`, no `constants/` and no `modals.config.ts` any more: reads go
through the shared lookup bridges and writes through `src/data/media-manage.api.ts`, folders are
created/renamed inline in the tree rather than in a registry modal, and the MIME filter options
live with the explorer that renders them.

## Cross-module bridge (W5) + the reusable media-library modal

Shared, so any module picks/uploads media WITHOUT importing this module:

- **Read bridges** (`src/data/lookups/`): `media-lookup.api` (search + by-id + public-resolve),
  `folder-lookup.api` (folder search/resolve **+ `getFolderTree`**, the explorer's sidebar).
- **Write bridge** (`src/data/media-manage.api.ts`, `reducerPath: 'mediaManageApi'`):
  `signUpload` / `confirmUpload` (publishes `media.asset.uploaded`) / `createFolder`
  (`media.folder.created`) / `updateFolder` + `deleteFolder` (`media.folder.changed`) /
  `moveAssets` (`media.assets.moved`) / `deleteAsset` (`media.asset.deleted`). Its own reducerPath
  keeps the cache decoupled; cross-api refresh rides the event bus (W4).
- **`src/components/media-picker/`** — **`MediaLibraryModal`**: the full explorer at the
  near-full-screen `full` dialog size, with a `DialogStackHeader` breadcrumb and a Select→confirm
  footer. Opened imperatively from any form via **`useMediaLibraryPicker`**; both field wrappers
  use it — **`MediaIdPickerField`** (id-valued: project/blog/team/services/testimonials/block
  covers) and **`MediaPickerField`** (url-valued: branding). The Content Studio's in-canvas image
  picker opens the same modal.

## Contracts

`MediaAsset`, `MediaFolder`, `MediaFolderTree`/`MediaFolderNode`, `UploadSignRequest`/
`UploadSignResult`/`UploadInstruction`, `UploadConfirmBody`, `MediaListQuery` (+ the
`MEDIA_ROOT_FOLDER` sentinel), `FolderCreateRequest`, `FolderUpdateRequest`,
`FolderDeleteStrategy`, `MediaMoveRequest`/`MediaMoveResult`, `Paginated<MediaAsset>`,
`MEDIA_PERMISSIONS` — all from `@sanad/contracts` (U3).

## Tests

- `components/media-page.spec.tsx` — the page mounts the explorer under its own heading, and a
  read-only user gets the library without write actions.
- Everything else is tested where it lives: `src/components/media-explorer/*.spec.*` (states,
  tree maths, drop validity, the upload queue), `src/components/media-picker/*.spec.tsx` (the
  modal and the two fields), `src/lib/*.spec.ts` (transport, classification, byte formatting).

## Deferred

Per-locale `alt` editing (W6) for assets is a follow-up — uploads store empty `alt {ar,en}`; the
contract supports editing it later.

## Upload failures are never silent (2026-07-20, U23)

The owner clicked upload in the picker and **nothing happened** — no toast, no message, no clue.
Three separate causes, all fixed:

1. **The transport lost its meaning.** A failed CORS preflight makes the request _fail_ rather
   than answer non-2xx (the browser withholds the status by design), so `putToR2` threw a bare
   error that both hooks classified as "unknown". `UploadTransportError` now carries a `kind`
   (`cors | network | http`), the status, and R2's own `<Code>/<Message>` parsed from its XML body.
2. **Two hooks, two vocabularies.** The page and the picker each mapped errors their own way. One
   shared `classifyUploadError` (F9/U3) now names a cause the same way wherever it surfaces, and
   every branch exists because it implies a different user action — configure CORS, reconnect, ask
   an admin, choose a smaller file. Notably a **storage 403** (the bucket refusing the PUT) reads
   differently from a **gateway 403** (our RBAC), so nobody hunts for permissions they already have.
3. **The message had nowhere to land.** The picker exposed `error` and the caller that mattered
   never rendered it. Failures now raise a **toast** (which a caller cannot forget to render) _and_
   stay on screen in the upload tray with a **retry** — offered only when re-sending the same bytes
   could plausibly work.

The same pass fixed the empty `catch` around folder-create, which reported nothing when a create
failed — the reason the live library had accumulated fourteen "Brand" folders.
