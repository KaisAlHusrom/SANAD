# media-service

> The Sanad Tech media store (P4) — presigned (signed) uploads to **Cloudflare R2** +
> a translatable media library. Never faces the public internet (MS4); the bytes go
> client → R2 directly, never through the gateway.

## Purpose

The reusable image/file store the CMS (P5), admin media library (P7), and website (P8)
all draw on for logos, portfolio images, blog covers, etc. The client asks for a
**presigned PUT URL**, uploads bytes **straight to R2**, then **confirms**; the asset
records and resolves to a CDN URL. A delete soft-deletes the row and emits `media.deleted`
(Outbox, MS3) so the content-service can reconcile references. Image `alt` text is
translatable (ar/en, N5).

## Toolchain

NestJS 11, ESM + SWC (N11), **hybrid app**: an HTTP `/health` endpoint + an RMQ
microservice consuming `media.commands`. Own database (MS5) via Drizzle; migrations in
`src/db/migrations` (generate → migrate, never push). S3 SDK (`@aws-sdk/client-s3` +
`@aws-sdk/s3-request-presigner`) is touched in exactly one place — the `StorageProvider`.

## Entities (own DB — `media` / `media_test`)

| Table                     | Notes                                                                                                                                                                                                        |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `media_folder`            | flat organizational label; `parent_id` self-ref reserves nesting; soft-delete                                                                                                                                |
| `media_asset`             | `key` (R2 object key, unique), `filename`, `mime_type`, `size`, `width`/`height`, `status` (`pending`/`ready`), `folder_id`; soft-delete. The CDN `url` is derived from `key` at read time (never persisted) |
| `media_asset_translation` | per-locale `alt` text (N5); composite PK `(media_asset_id, locale)`                                                                                                                                          |
| `outbox`                  | transactional Outbox (MS3), shared table from `@sanad/messaging`                                                                                                                                             |

## Signed-upload flow

1. **sign** (`media.upload.sign`) — validate MIME/size against the coded policy
   (`ALLOWED_MIME_TYPES` + `MEDIA_MAX_UPLOAD_BYTES`), create a `pending` asset (id
   pre-generated to seed the R2 key `uploads/<id>/<filename>`) + optional alt, mint a
   presigned PUT URL. The client then PUTs bytes **directly to R2**.
2. **confirm** (`media.upload.confirm`) — best-effort `HEAD` the object to capture real
   size/content-type, set dimensions/alt, mark `ready`, return the asset with its CDN url.
3. **delete** (`media.asset.delete`) — soft-delete + enqueue `media.deleted` in ONE
   transaction (MS3), then best-effort remove the R2 object.

## Storage boundary + credentials seam (reworked 2026-07-19 — capability→providers)

`StorageProvider` (abstract) is the only place the AWS SDK is used; `R2StorageProvider` implements
it against R2's S3 API (region `auto`).

Credentials come from the **active storage provider** via
`resolveActiveStorageConfig(settingsClient, env, provider?)`: it asks settings-service
(`settings.integration.resolve` for capability `storage`, MS2) which provider is active and for its
stored values, then merges **each field** vault → media env → missing, using the catalog
descriptor's `envVar` (U9/F7). So an env-configured deploy keeps working while anything set in the
admin overrides it. When a required field is missing everywhere the provider is unconfigured: the
service still boots and mutating ops surface a clean **503**; `publicUrl` stays tolerant so listing
works regardless.

**No restart.** The resolved client is cached for `STORAGE_CREDENTIALS_TTL_MS` (~60s), keyed by a
fingerprint that **includes the provider id** — so both a credential change AND a provider switch
rebuild the S3 client, while the read path (public-URL assembly on every listing) stays off RMQ.
Every storage-touching `MediaService` method calls `storage.refresh()` first.

**Testing (MS1).** `testConnection(provider, locale)` resolves that SPECIFIC provider (not the
active one, so a provider can be proven before activation), builds a throwaway client and issues a
real `HeadBucket`, returning `{ ok, message, detail? }`. The `message` sits **inside the payload**,
where the gateway's envelope renderer can't reach it, so the service translates it itself from the
forwarded caller locale (U24d) — `StorageTestMessageController` reads it with
`resolveRequestLocale(readMessageHeaders(ctx))`. `detail` carries the vendor's own untranslated
text (`SignatureDoesNotMatch`, …) so the owner can see which key is wrong (U24e). The gateway routes
`POST /api/integrations/storage/:provider/test` here — media-service owns the S3 adapter, so
settings-service never learns S3. Exposed as the `media.storage.test` message pattern.

**CORS check (same rule).** `corsStatus(locale, provider)` / `applyCors(locale, provider)` take the
locale FIRST and localize their `message` too — `media.cors.cannotCheck` / `.applyFailed` /
`.unconfigured` / `.unsupported` — with AWS's own words in `StorageCorsStatus.detail` (U24d/e).
`storage-cors.message-controller.ts` reads the forwarded locale exactly like its `testConnection`
sibling. This surface was missed in the first U24 pass and caught by the verifier: it renders one
button away from "Test connection" on the same admin page, so an English `AccessDenied` there was
the very bug the owner reported.

## Errors — keys, never prose (U24)

[`media-errors.ts`](src/media/application/media-errors.ts) returns `rpcError(status, key, params)`
from [`@sanad/i18n`](../../libs/shared/i18n/i18n.md); the text lives only in the ar/en catalogs and
is rendered once at the gateway edge.

| Factory                             | Status | Key                                     |
| ----------------------------------- | ------ | --------------------------------------- |
| `mediaNotFound(id)`                 | 404    | `media.notFound`                        |
| `uploadTypeNotAllowed(contentType)` | 400    | `media.upload.typeNotAllowed`           |
| `uploadTooLarge(maxBytes)`          | 400    | `media.upload.tooLarge` (param `maxMb`) |
| `storageUnavailable()`              | 503    | `media.storageUnavailable`              |

The old `uploadNotAllowed(message)` took a caller-composed English sentence and is gone: the
upload policy now picks the key and passes the offending value as a `param`, so the whole
sentence lives in the catalog.

## Contracts (`@sanad/contracts/media`)

`MediaAsset`, `MediaAssetStatus`, `MediaFolder`, `uploadSignRequestSchema`,
`UploadSignResult`, `uploadConfirmBodySchema`/`uploadConfirmRequestSchema`,
`mediaListQuerySchema`, `folderCreateRequestSchema`/`folderListQuerySchema`,
`mediaIdSchema`, `MediaDeletedEvent`, `MEDIA_PERMISSIONS`, and the message-pattern
constants. List reuses the shared `listQuerySchema` (U17).

**Public resolver (8.C):** `mediaPublicResolveRequestSchema` (`{ ids: uuid[] }`, `.strict()`,
`max(100)`) + `PublicMediaRef` (`{ id, url, alt, width, height }`) — the public-safe slim of
`MediaAsset` (no key/status/folder) the website renders images from without a token.

## Message patterns (MS2 — request/reply)

| Pattern                      | Payload                                  | Reply                   |
| ---------------------------- | ---------------------------------------- | ----------------------- |
| `media.upload.sign`          | `UploadSignRequest` (+ identity headers) | `UploadSignResult`      |
| `media.upload.confirm`       | `UploadConfirmRequest` (+ identity)      | `MediaAsset`            |
| `media.asset.list`           | `MediaListQuery` (+ identity)            | `Paginated<MediaAsset>` |
| `media.asset.get`            | `{ id }` (+ identity)                    | `MediaAsset`            |
| `media.asset.resolve-public` | `{ ids: uuid[] }` (NO identity)          | `PublicMediaRef[]`      |
| `media.asset.delete`         | `{ id }` (+ identity)                    | `{ id }`                |
| `media.folder.create`        | `FolderCreateRequest` (+ identity)       | `MediaFolder`           |
| `media.folder.list`          | `FolderListQuery` (+ identity)           | `MediaFolder[]`         |
| `media.folder.tree`          | `{}` (+ identity)                        | `MediaFolderTree`       |
| `media.folder.update`        | `FolderUpdatePayload` (+ identity)       | `MediaFolder`           |
| `media.folder.delete`        | `FolderDeletePayload` (+ identity)       | `{ id }`                |
| `media.asset.move`           | `MediaMoveRequest` (+ identity)          | `MediaMoveResult`       |
| `media.storage.test`         | `{ capability, provider }` (+ identity)  | `IntegrationTestResult` |
| `media.storage.cors-status`  | `{ capability, provider }` (+ identity)  | `StorageCorsStatus`     |
| `media.storage.cors-apply`   | `{ capability, provider }` (+ identity)  | `StorageCorsStatus`     |

## Events emitted (MS3 — Outbox)

| Event           | Payload       | Consumers                                                                |
| --------------- | ------------- | ------------------------------------------------------------------------ |
| `media.deleted` | `{ id, key }` | content-service (`media-deleted.consumer.ts` → reference reconciliation) |

## Gateway surface (all guarded, MS4)

`POST /api/media/uploads` (`media.manage`), `POST /api/media/uploads/:id/confirm`
(`media.manage`), `GET /api/media` (`media.read`), `GET /api/media/:id` (`media.read`),
`DELETE /api/media/:id` (`media.manage`), `POST /api/media/folders` (`media.manage`),
`GET /api/media/folders` (`media.read`), `GET /api/media/folders/tree` (`media.read`),
`PATCH /api/media/folders/:id` (`media.manage`), `DELETE /api/media/folders/:id?strategy=`
(`media.manage`), `PATCH /api/media/move` (`media.manage`).

`GET|POST /api/integrations/storage/:provider/cors` (per-capability integration permission) —
the browser-CORS self-check + one-click apply; see below.

**Public (UNGUARDED, 8.C):** `GET /api/media/public?ids=a,b,c` → `PublicMediaRef[]` — the
website resolves content media ids → CDN urls without a token (only `ready` assets resolve;
`ids` is a bounded, deduped CSV). Declared before `GET /media/:id` so the literal path wins.

## Folders are a TREE (2026-07-20)

`parent_id` existed from P4 but nothing used it. The explorer needs real nesting, so the service
now owns the tree operations, each defending an invariant that is invisible until it hurts:

- **Unique name per parent** — a partial unique index on `(parent_id, lower(name)) WHERE
deleted_at IS NULL`, plus a friendly 409 (`media.folder.duplicateName`) ahead of it. Migration
  `0001_folder_tree_uniqueness` first MERGES the duplicates that already existed (the live dev DB
  had **14 folders named "Brand"** and 2 named "مشاريع", created by a picker that swallowed its
  create errors): the oldest survives and adopts the others' assets + subfolders, the rest are
  **soft-deleted**, so a migration never destroys data.
- **No cycles** — `wouldCreateCycle` refuses moving a folder into itself or a descendant. Such a
  move keeps the row but detaches the subtree from every root, which reads as data loss.
- **No surprise deletion** — `DELETE …?strategy=block` (the default) refuses a non-empty folder
  and reports what is inside; `strategy=reparent` lifts its contents up one level first. Assets
  are never destroyed as a side effect of removing the folder that held them.
- **Bulk move** — `PATCH /api/media/move { ids[], folderId|null }` is one request per drag,
  however many files were selected, and returns `missingIds` rather than silently moving fewer
  than asked.

`GET /api/media` gained `status` and the `folderId=root` sentinel (assets in NO folder — SQL
`= NULL` can't express it, so it maps to a whitelisted `isNull` filter, N7).

## Storage health: credentials vs. BROWSER CORS (2026-07-20)

They fail independently, so they are separate checks:

- **`media.storage.test`** proves the credentials with a real `HeadBucket`, and now also reports
  a `publicUrl` pointing at the **signed S3 API endpoint** — that uploads fine and then 403s
  every rendered `<img>`.
- **`media.storage.cors-status` / `-apply`** answer "can the browser upload at all?". The admin
  is a SPA: it PUTs bytes from the browser straight to the bucket, so the bucket must allow the
  admin's origin or every upload dies in preflight with `403 CORS not configured` — the owner's
  reported bug. The status is one of `ok | missing | origin-not-allowed | cannot-check |
unconfigured` (U23: one per thing the admin must see and act on), and `apply` writes the policy
  via `PutBucketCors` and RE-READS it, so a returned `ok` is observed, not assumed. An
  object-scoped R2 token cannot touch bucket config → `cannot-check` + `canApply:false`, and the
  UI shows the copy-paste policy instead of a button that would fail. Required origins come from
  `ADMIN_PUBLIC_ORIGINS` (U19). Ops fallback: `infra/scripts/r2-cors.sh` + `infra/r2/cors.json`.

**Presign gotcha (fixed):** `@aws-sdk/client-s3` ≥3.1075 defaults
`requestChecksumCalculation:'WHEN_SUPPORTED'`, which leaves an **empty-body**
`x-amz-checksum-crc32` in the presigned URL; R2 rejects the real bytes against it. Every
`S3Client` here is built by `buildS3Client` with `WHEN_REQUIRED`.

## Pending-upload sweeper

An asset row is written at SIGN time and only becomes `ready` at CONFIRM, so an upload that dies
in between leaves an invisible `pending` row (the owner's two blocked uploads left exactly two).
Past the presigned URL's lifetime such a row can never be confirmed, so
`PendingUploadSweeperService` deletes it (nothing landed in storage to reconcile) — at boot and
every `PENDING_SWEEP_INTERVAL_MS`, with a grace period well beyond the URL TTL.

## Settings used

None yet. The upload allowlist + size ceiling are coded constants (U18) / env
(`MEDIA_MAX_UPLOAD_BYTES`); resolving them from the settings-service (U9) is a later
enhancement.

## Event catalog (U27)

Every event this service emits or consumes is declared once in the **`EVENT_CATALOG`**
(`libs/contracts/src/lib/events/`), with its payload schema, its producer and its consumers —
and the publish path is typed against it, so an un-catalogued name is a typecheck failure
(`createOutboxRecord` only accepts a `BrokerEventName`). Adding an event here means adding its
`*.event.ts` to the catalog in the same change.
