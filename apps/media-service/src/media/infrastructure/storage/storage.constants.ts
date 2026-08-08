/** How long a presigned upload URL stays valid (seconds). 15 minutes. */
export const SIGNED_UPLOAD_TTL_SECONDS = 900;

/** S3 region sent to R2 — R2 ignores it but the SDK requires a value. */
export const R2_REGION = 'auto';

/**
 * How long resolved R2 credentials are cached before re-resolving from the vault (ms).
 * Keeps the read path (public-URL assembly on every listing) off RMQ, while a freshly
 * pasted admin key takes effect within this window — no service restart (owner decision).
 */
export const STORAGE_CREDENTIALS_TTL_MS = 60_000;

/**
 * The bucket CORS policy we write for browser (presigned-PUT) uploads. `PUT` uploads, `GET`/
 * `HEAD` let a `fetch`/canvas read an asset back, and `content-type` is the header the browser
 * preflights because `putToR2` sends it. `etag` is exposed so a client can read the stored
 * object's hash. Never a `*` origin — the policy is written with our real origins only.
 */
export const CORS_ALLOWED_METHODS = ['PUT', 'GET', 'HEAD'] as const;
export const CORS_ALLOWED_HEADERS = ['content-type'] as const;
export const CORS_EXPOSE_HEADERS = ['etag'] as const;
/** How long a browser may cache the preflight result (seconds). 1 hour. */
export const CORS_MAX_AGE_SECONDS = 3600;
