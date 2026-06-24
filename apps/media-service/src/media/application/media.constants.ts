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
