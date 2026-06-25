import { z } from 'zod';
import { secretManagePermission } from './permission.js';

/**
 * The third-party integration secrets the system knows about (N13). Each is a single
 * credential (API key / token / password) stored **encrypted at rest** (AES-256-GCM) in
 * the settings-service's `integration_secret` vault and resolved server-side only — never
 * the settings/branding catalog (which resolves onto public endpoints), never returned to
 * a client in plaintext. Only keys SANAD actually has a consumer for are registered
 * (U15 — no inventing). `SMTP_PASSWORD` is the live one (notifications-service, P6);
 * `R2_SECRET_KEY` is registered-but-deferred (media keeps its own env seam for now).
 */
export const secretKeySchema = z.enum(['SMTP_PASSWORD', 'R2_SECRET_KEY']);
export type SecretKey = z.infer<typeof secretKeySchema>;

/** The integration category a secret belongs to — drives grouping on the admin surface. */
export const secretFeatureSchema = z.enum(['email', 'storage']);
export type SecretFeature = z.infer<typeof secretFeatureSchema>;

/**
 * One registry entry per known secret — the single source the gateway/admin + the
 * settings-service share (U3). `envVar` is the env name kept as a resolution fallback
 * (DB → env → null, N13). `wired` flags whether a feature actually consumes it yet.
 * `managePermission` is the per-integration RBAC key that gates set/rotate (N13 —
 * each third party owns its permission), derived from the feature.
 */
export interface SecretRegistryEntry {
  key: SecretKey;
  feature: SecretFeature;
  envVar: string;
  wired: boolean;
  managePermission: string;
}

const entry = (
  key: SecretKey,
  feature: SecretFeature,
  envVar: string,
  wired: boolean,
): SecretRegistryEntry => ({
  key,
  feature,
  envVar,
  wired,
  managePermission: secretManagePermission(feature),
});

/** The full secret registry, keyed by `SecretKey`. Add an entry as integrations land. */
export const SECRET_REGISTRY: Record<SecretKey, SecretRegistryEntry> = {
  SMTP_PASSWORD: entry('SMTP_PASSWORD', 'email', 'SMTP_PASSWORD', true),
  R2_SECRET_KEY: entry(
    'R2_SECRET_KEY',
    'storage',
    'R2_SECRET_ACCESS_KEY',
    false,
  ),
};

/** Every registered secret, in declaration order — the list the admin surface renders. */
export const SECRET_REGISTRY_LIST: readonly SecretRegistryEntry[] =
  Object.values(SECRET_REGISTRY);
