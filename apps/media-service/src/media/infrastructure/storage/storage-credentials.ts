import type { MediaEnv } from '../../../env.js';
import type { R2Credentials } from './storage.provider.js';

/**
 * THE credentials seam (decision 2026-06-23). For P4 the R2 secret + config are read
 * from the typed env accessor. This single function is where the future swap lands:
 * the secret will be resolved from the encrypted integration-secrets vault via the
 * settings-service (`settings.resolve-secret`, MS2) — never hardcoded, never in the
 * public settings table. Returns null when storage isn't fully configured (the service
 * boots; uploads 503 until set).
 */
export function getStorageCredentials(env: MediaEnv): R2Credentials | null {
  if (
    env.R2_ACCOUNT_ID &&
    env.R2_ACCESS_KEY_ID &&
    env.R2_SECRET_ACCESS_KEY &&
    env.R2_BUCKET &&
    env.R2_ENDPOINT &&
    env.R2_PUBLIC_URL
  ) {
    return {
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucket: env.R2_BUCKET,
      endpoint: env.R2_ENDPOINT,
      publicUrl: env.R2_PUBLIC_URL,
    };
  }
  return null;
}
