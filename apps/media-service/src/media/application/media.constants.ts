/**
 * Coded media policy (U18). The allowed upload MIME types and the R2 object-key prefix.
 * The per-upload byte ceiling is `MEDIA_MAX_UPLOAD_BYTES` on the env accessor (U19).
 * Resolving these from the settings-service (U9) is a later enhancement.
 */
export const ALLOWED_MIME_TYPES: readonly string[] = [
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
];

/** R2 object keys are namespaced under this prefix: `uploads/<assetId>/<filename>`. */
export const MEDIA_KEY_PREFIX = 'uploads';

/**
 * How old a `pending` asset must be before the sweeper deletes it (ms). Comfortably longer than
 * `SIGNED_UPLOAD_TTL_SECONDS` (15 min): past the URL's lifetime the row can never be confirmed,
 * and the extra margin keeps a slow-but-live upload safe. 1 hour.
 */
export const PENDING_UPLOAD_GRACE_MS = 60 * 60 * 1000;

/** How often the sweeper runs (ms). Housekeeping — 15 minutes is ample. */
export const PENDING_SWEEP_INTERVAL_MS = 15 * 60 * 1000;
