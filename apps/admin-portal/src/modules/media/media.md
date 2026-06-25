# media module (admin-portal)

The media library — presigned-upload to Cloudflare R2, list, folders, delete. Built in P7.B. Consumes the P4 gateway surface.

## Files

- `api/media.api.ts` — RTK Query api (`reducerPath: 'mediaApi'`, `baseQuery: baseQueryWithAuth`). Endpoints: `signUpload` (`POST /media/uploads`), `confirmUpload` (`POST /media/uploads/:id/confirm`), `listMedia` (`GET /media`), `getMedia`, `deleteMedia` (`DELETE /media/:id`), `createFolder` (`POST /media/folders`), `listFolders` (`GET /media/folders`). `confirmUpload`/`deleteMedia` publish `media.asset.uploaded`/`media.asset.deleted` (W4); lists refresh via `MediaAsset`/`MediaFolder` tag invalidation.
- `lib/put-to-r2.ts` — the raw direct-to-R2 `PUT`. **Bypasses `baseQueryWithAuth`** (no bearer, no envelope — the presign IS the auth); a non-2xx throws `UploadTransportError`. Must NOT live in the api slice.
- `lib/read-image-dimensions.ts` — reads an image File's natural width/height client-side (`undefined` for non-images / load errors → confirm omits dims).
- `hooks/use-upload.ts` — orchestrates **sign → putToR2 → read dimensions → confirm** with a single status/error (U5). 503 → "storage not configured" message.
- `hooks/use-upload-button.ts` — file-input wiring (open picker, read file, run `useUpload`).
- `hooks/use-media-list.ts` — owns `{page, folderId, type}` filter state → `listMedia` args; exposes `isStorageUnconfigured` (503) for the error message.
- `hooks/use-media-card.ts` — `isImage` derivation. `hooks/use-delete-media.ts` — opens the shared **`useConfirm`** (mutation-aware, danger tone) and toasts the outcome (no local dialog state). `hooks/use-create-folder.ts` — new-folder `folderCreateRequestSchema` form; takes the registry `onClose`, toasts on success/error (P7.C Wave 1 kit).
- `components/` — `media-page.tsx` (toolbar + `RenderGate(listMedia)`: skeleton/error/empty/grid; the **New folder** button opens the `media.new-folder` registry modal), `media-grid.tsx`, `media-card.tsx` (image thumbnail or file icon + delete), `folder-filter.tsx`, `type-filter.tsx`, `upload-button.tsx`, `new-folder-modal.tsx` (a global-registry modal, `NEW_FOLDER_MODAL`), `delete-media-button.tsx` (a plain trigger — the confirmation is rendered by the shell `ConfirmationRoot`). Upload/new-folder/delete are gated by `media.manage`; the route is `media.read`.
- `modals.config.ts` — registers `NewFolderModal` for the `media.new-folder` type (W7); imported once from `src/app/modals.config.ts`.
- `constants/media-type-options.ts` — the MIME-prefix filter options.
- `i18n/{ar,en}.json` — the `media` catalog (parity, U8); registered at import.

## Cross-module bridge (W5)

The shared **`src/data/lookups/media-lookup.api.ts`** (`mediaLookupApi`) + **`src/components/media-picker/`** (`MediaPickerField` + `useMediaPicker`) let other modules (branding) pick an asset url WITHOUT importing this module's api. The picker only fetches while open + with `media.read`, filters to images, and falls back to a plain URL input otherwise.

## Contracts

`MediaAsset`, `MediaFolder`, `UploadSignRequest`/`UploadSignResult`/`UploadInstruction`, `UploadConfirmBody`, `MediaListQuery`, `FolderCreateRequest`, `Paginated<MediaAsset>`, `DEFAULT_PAGE_SIZE`, `MEDIA_PERMISSIONS` — all from `@sanad/contracts` (U3).

## Events

Publishes `media.asset.uploaded {assetId}` (on confirm) and `media.asset.deleted {assetId}` (on delete) on the client event bus (W4).

## Tests

- `lib/put-to-r2.spec.ts` — direct PUT, **no auth header**, throws on non-2xx.
- `lib/read-image-dimensions.spec.ts` — dims for an image, `undefined` for non-image / load error.
- `api/media.api.spec.ts` — all routes, query serialization, upload/delete events.
- `hooks/use-upload.spec.tsx` — sign→PUT→confirm in order; non-image omits dims; R2 failure stops before confirm; 503 message.
- `hooks/use-media-list.spec.tsx` — filter change → query args.
- `hooks/use-delete-media.spec.tsx` — confirm → DELETE + success toast + close; failure → error toast + confirmation stays open (with `ConfirmationRoot` + `Toaster`).
- `hooks/use-create-folder.spec.tsx` — open via the registry → POST + success toast + close; failure → inline + toast error, dialog stays open.
- `components/media-page.spec.tsx` — RenderGate order (empty/data/503), manage-gated controls, the shared delete confirmation (with `ConfirmationRoot`).

## Deferred

Per-locale `alt` editing (W6) for assets is a follow-up — uploads store empty `alt {ar,en}`; the contract supports editing it later.
