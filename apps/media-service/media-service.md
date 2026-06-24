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

## Storage boundary + credentials seam (decision 2026-06-23)

`StorageProvider` (abstract) is the only place the AWS SDK is used; `R2StorageProvider`
implements it against R2's S3 API (region `auto`). Credentials are resolved through the
**`getStorageCredentials()` seam**, which today reads the typed env accessor. R2 vars are
**optional** — when unset the provider is unconfigured, the service still boots, and
uploads return a clean **503**; `publicUrl` stays tolerant so listing always works.

**These R2 keys are SECRETS and never live in the settings table** (it resolves onto the
public website). The seam is the single place the future swap lands: the R2 secret will be
resolved from the encrypted **integration-secrets vault** in the settings-service
(`settings.resolve-secret`, MS2) — see `.claude/docs/PROGRESS.md` and rule SEC1.

## Contracts (`@sanad/contracts/media`)

`MediaAsset`, `MediaAssetStatus`, `MediaFolder`, `uploadSignRequestSchema`,
`UploadSignResult`, `uploadConfirmBodySchema`/`uploadConfirmRequestSchema`,
`mediaListQuerySchema`, `folderCreateRequestSchema`/`folderListQuerySchema`,
`mediaIdSchema`, `MediaDeletedEvent`, `MEDIA_PERMISSIONS`, and the message-pattern
constants. List reuses the shared `listQuerySchema` (U17).

## Message patterns (MS2 — request/reply)

| Pattern                | Payload                                  | Reply                   |
| ---------------------- | ---------------------------------------- | ----------------------- |
| `media.upload.sign`    | `UploadSignRequest` (+ identity headers) | `UploadSignResult`      |
| `media.upload.confirm` | `UploadConfirmRequest` (+ identity)      | `MediaAsset`            |
| `media.asset.list`     | `MediaListQuery` (+ identity)            | `Paginated<MediaAsset>` |
| `media.asset.get`      | `{ id }` (+ identity)                    | `MediaAsset`            |
| `media.asset.delete`   | `{ id }` (+ identity)                    | `{ id }`                |
| `media.folder.create`  | `FolderCreateRequest` (+ identity)       | `MediaFolder`           |
| `media.folder.list`    | `FolderListQuery` (+ identity)           | `MediaFolder[]`         |

## Events emitted (MS3 — Outbox)

| Event           | Payload       | Consumers                                                |
| --------------- | ------------- | -------------------------------------------------------- |
| `media.deleted` | `{ id, key }` | (none yet — P5 content-service reference reconciliation) |

## Gateway surface (all guarded, MS4)

`POST /api/media/uploads` (`media.manage`), `POST /api/media/uploads/:id/confirm`
(`media.manage`), `GET /api/media` (`media.read`), `GET /api/media/:id` (`media.read`),
`DELETE /api/media/:id` (`media.manage`), `POST /api/media/folders` (`media.manage`),
`GET /api/media/folders` (`media.read`).

## Settings used

None yet. The upload allowlist + size ceiling are coded constants (U18) / env
(`MEDIA_MAX_UPLOAD_BYTES`); resolving them from the settings-service (U9) is a later
enhancement.
