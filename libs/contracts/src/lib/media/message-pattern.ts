/**
 * Media-service message patterns (the single source FE/BE/gateway share, U3).
 * Request/reply reads + the upload commands use `<service>.<resource>.<action>`
 * (MS2); the emitted domain event uses `<entity>.<event>` (MS3).
 */
export const MEDIA_UPLOAD_SIGN = 'media.upload.sign';
export const MEDIA_UPLOAD_CONFIRM = 'media.upload.confirm';
export const MEDIA_ASSET_LIST = 'media.asset.list';
export const MEDIA_ASSET_GET = 'media.asset.get';
export const MEDIA_ASSET_DELETE = 'media.asset.delete';
export const MEDIA_FOLDER_CREATE = 'media.folder.create';
export const MEDIA_FOLDER_LIST = 'media.folder.list';

/** Emitted (Outbox, MS3) when an asset is deleted — content-service reconciles refs (P5). */
export const MEDIA_DELETED_EVENT = 'media.deleted';
