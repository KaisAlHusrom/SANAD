/**
 * Media-service message patterns (the single source FE/BE/gateway share, U3).
 * Request/reply reads + the upload commands use `<service>.<resource>.<action>`
 * (MS2); the emitted domain event uses `<entity>.<event>` (MS3).
 */
export const MEDIA_UPLOAD_SIGN = 'media.upload.sign';
export const MEDIA_UPLOAD_CONFIRM = 'media.upload.confirm';
export const MEDIA_ASSET_LIST = 'media.asset.list';
export const MEDIA_ASSET_GET = 'media.asset.get';
export const MEDIA_PUBLIC_RESOLVE = 'media.asset.resolve-public';
export const MEDIA_ASSET_DELETE = 'media.asset.delete';
export const MEDIA_FOLDER_CREATE = 'media.folder.create';
export const MEDIA_FOLDER_LIST = 'media.folder.list';
/** The whole folder tree + per-folder asset counts — one request for the explorer's pane. */
export const MEDIA_FOLDER_TREE = 'media.folder.tree';
/** Rename and/or re-parent a folder (a drag in the tree). */
export const MEDIA_FOLDER_UPDATE = 'media.folder.update';
/** Delete a folder (blocked when non-empty unless the caller asks to re-parent its contents). */
export const MEDIA_FOLDER_DELETE = 'media.folder.delete';
/** Move assets between folders in bulk — what dropping a selection onto a folder does. */
export const MEDIA_ASSET_MOVE = 'media.asset.move';

/**
 * Test a storage provider's credentials with a real round-trip (a `HeadBucket`). The gateway
 * routes `POST /api/integrations/storage/:provider/test` here because media-service OWNS the
 * S3 adapter — settings-service must never learn S3 (MS1).
 */
export const MEDIA_STORAGE_TEST = 'media.storage.test';

/**
 * Inspect / write the bucket's **browser CORS** policy. Separate from the credential test above
 * because they fail independently: credentials can be perfect (`HeadBucket` 200) while every
 * browser upload still 403s for want of a CORS rule (rules change-log 2026-07-20). Both carry
 * the same `{ capability, provider }` payload as the test pattern (U3 — no new payload shape).
 */
export const MEDIA_STORAGE_CORS_STATUS = 'media.storage.cors-status';
export const MEDIA_STORAGE_CORS_APPLY = 'media.storage.cors-apply';

/** Emitted (Outbox, MS3) when an asset is deleted — content-service reconciles refs (P5). */
export const MEDIA_DELETED_EVENT = 'media.deleted';
