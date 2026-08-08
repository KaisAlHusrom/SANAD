import type { ClientProxy } from '@nestjs/microservices';
import {
  getProviderDescriptor,
  SETTINGS_INTEGRATION_RESOLVE,
  type IntegrationProviderId,
  type ResolvedIntegrationConfig,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import type { MediaEnv } from '../../../env.js';
import type { R2Credentials } from './storage.provider.js';

/** The provider media-service falls back to when settings is unreachable (env-only deploys). */
const DEFAULT_PROVIDER: IntegrationProviderId = 'r2';

/** One storage provider's resolved credentials, tagged with which provider produced them. */
export interface ResolvedStorage {
  provider: IntegrationProviderId;
  credentials: R2Credentials;
}

/**
 * The media env values, keyed by the env-var NAME the catalog descriptors reference. Explicit
 * (not dynamic `process.env` indexing) so the typed env accessor stays the single source (U19)
 * and there is no `any` (U4).
 */
function envByVarName(env: MediaEnv): Record<string, string | undefined> {
  return {
    R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY,
    R2_BUCKET: env.R2_BUCKET,
    R2_ENDPOINT: env.R2_ENDPOINT,
    R2_PUBLIC_URL: env.R2_PUBLIC_URL,
  };
}

/** Ask settings for a provider's stored config; tolerate an unreachable/no-responder broker. */
async function resolveFromVault(
  client: ClientProxy,
  provider?: IntegrationProviderId,
): Promise<ResolvedIntegrationConfig | null> {
  try {
    return await sendRequest<ResolvedIntegrationConfig | null>(
      client,
      SETTINGS_INTEGRATION_RESOLVE,
      provider
        ? { capability: 'storage', provider }
        : { capability: 'storage' },
    );
  } catch {
    // Settings unreachable / no responder — fall through to the env fallback.
    return null;
  }
}

/**
 * THE storage credentials seam (N13, capability→providers rework). Resolves the **active**
 * storage provider (or a named one, for "Test connection") and merges each field
 * **vault → media env → missing**, per the catalog descriptor's `envVar` — the settings-with-
 * defaults pattern (U9/F7), so an env-configured deploy keeps working while anything set in
 * the admin overrides it. Returns null when a required field is still missing (the service
 * boots; uploads 503 until configured).
 */
export async function resolveActiveStorageConfig(
  client: ClientProxy,
  env: MediaEnv,
  provider?: IntegrationProviderId,
): Promise<ResolvedStorage | null> {
  const resolved = await resolveFromVault(client, provider);
  const target = provider ?? resolved?.provider ?? DEFAULT_PROVIDER;
  const descriptor = getProviderDescriptor('storage', target);
  if (!descriptor) {
    return null;
  }

  const envValues = envByVarName(env);
  const values: Record<string, string> = {};
  for (const fieldDescriptor of descriptor.fields) {
    const fromVault = resolved?.values[fieldDescriptor.key];
    const fromEnv = fieldDescriptor.envVar
      ? envValues[fieldDescriptor.envVar]
      : undefined;
    const value = fromVault ?? fromEnv;
    if (value) {
      values[fieldDescriptor.key] = value;
    }
  }

  const missing = descriptor.fields
    .filter((f) => f.required && !values[f.key])
    .map((f) => f.key);
  if (missing.length > 0) {
    return null;
  }

  return {
    provider: target,
    credentials: {
      accountId: values['accountId'] ?? '',
      accessKeyId: values['accessKeyId'] ?? '',
      secretAccessKey: values['secretAccessKey'] ?? '',
      bucket: values['bucket'] ?? '',
      endpoint: values['endpoint'] ?? '',
      publicUrl: values['publicUrl'] ?? '',
    },
  };
}
