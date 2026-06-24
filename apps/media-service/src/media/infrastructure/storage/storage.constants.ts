/** How long a presigned upload URL stays valid (seconds). 15 minutes. */
export const SIGNED_UPLOAD_TTL_SECONDS = 900;

/** S3 region sent to R2 — R2 ignores it but the SDK requires a value. */
export const R2_REGION = 'auto';
