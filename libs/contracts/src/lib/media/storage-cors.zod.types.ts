import { z } from 'zod';

/**
 * Why this contract exists (rules change-log 2026-07-20). The admin portal is a **SPA**: it
 * presigns at the gateway and then PUTs the bytes **from the browser** straight to the storage
 * host. That is a cross-origin request, so the browser sends a preflight and the BUCKET itself
 * must allow the admin's origin — otherwise R2 answers
 * `403 Unauthorized — CORS not configured for this bucket` and every upload dies before a byte
 * moves. (A server-side uploader — e.g. a Next.js route handler — never hits this, which is why
 * the owner had not seen it before.)
 *
 * So the platform must be able to (a) TELL the owner that browser uploads are blocked and
 * exactly why, and (b) FIX it in one click where the credentials allow (R2 implements the S3
 * `PutBucketCors` API). Both are surfaced by these shapes.
 */

/**
 * One bucket CORS rule — the S3/R2 shape, kept minimal to what we set and read back.
 * Not `.strict()` on read: a bucket may legitimately carry rules with fields we don't model.
 */
export const storageCorsRuleSchema = z.object({
  allowedOrigins: z.array(z.string()),
  allowedMethods: z.array(z.string()),
  allowedHeaders: z.array(z.string()),
  exposeHeaders: z.array(z.string()),
  maxAgeSeconds: z.number().int().nonnegative().nullable(),
});
export type StorageCorsRule = z.infer<typeof storageCorsRuleSchema>;

/**
 * The five states the storage CORS check can be in — one per thing the admin must be able to
 * SEE and act on (U23). Deliberately a flat `state` discriminator rather than a union of
 * differently-shaped objects: `requiredOrigins` and `policy` are meaningful in EVERY state
 * (they are what the owner pastes into the Cloudflare dashboard), so a union would repeat them
 * five times and force the UI to narrow before rendering shared chrome.
 *
 * - `ok` — every required origin is allowed to PUT. Uploads work.
 * - `missing` — the bucket has no CORS configuration at all (the state that produced the 403).
 * - `origin-not-allowed` — rules exist but not for our origin(s); `allowedOrigins` says which.
 * - `cannot-check` — the credentials can't read the bucket config (an object-scoped R2 token);
 *   `detail` carries the provider's verbatim reason and `canApply` is false → show the manual
 *   instructions instead of a dead end.
 * - `unconfigured` — no storage provider is configured yet; nothing to check.
 */
export const storageCorsStateSchema = z.enum([
  'ok',
  'missing',
  'origin-not-allowed',
  'cannot-check',
  'unconfigured',
]);
export type StorageCorsState = z.infer<typeof storageCorsStateSchema>;

/** The result of inspecting (or applying) a bucket's CORS configuration. */
export const storageCorsStatusSchema = z
  .object({
    state: storageCorsStateSchema,
    /** The origins the browser will upload from — derived from `APP_ENV` (U19/OPS1). */
    requiredOrigins: z.array(z.string()),
    /** The origins the bucket allows today (empty unless rules were readable). */
    allowedOrigins: z.array(z.string()),
    /**
     * Whether THIS deployment can write the policy itself. False when storage is unconfigured
     * or the credentials lack bucket-configuration scope — the UI then offers the copy-paste
     * policy + dashboard link rather than a button that will fail.
     */
    canApply: z.boolean(),
    /**
     * Owner-facing explanation for `cannot-check` / `unconfigured` / a failed apply — **already
     * localized** by media-service from the forwarded caller locale (U24d), since it rides
     * inside the payload where the gateway's envelope renderer can't reach it. `null` when the
     * state speaks for itself.
     */
    message: z.string().nullable(),
    /**
     * The vendor's OWN untranslated words (`AccessDenied`, `NoSuchBucket`) shown beneath the
     * localized line — the owner needs to know which credential is at fault, and only AWS can
     * say it (U24e). Never rendered INSTEAD of `message`.
     */
    detail: z.string().nullable(),
    /** The exact policy we would write — rendered as copyable JSON for the manual path. */
    policy: z.array(storageCorsRuleSchema),
  })
  .strict();
export type StorageCorsStatus = z.infer<typeof storageCorsStatusSchema>;
