import type { ClientProxy } from '@nestjs/microservices';
import {
  getProviderDescriptor,
  SETTINGS_INTEGRATION_RESOLVE,
  type IntegrationProviderId,
  type ResolvedIntegrationConfig,
} from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import type { NotificationsEnv } from '../../../env.js';

/** The provider notifications falls back to when settings is unreachable (env-only deploys). */
const DEFAULT_PROVIDER: IntegrationProviderId = 'smtp';

/** A fully-resolved SMTP transport config. */
export interface SmtpConfig {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  password?: string;
  from: string;
}

/** One resolved email provider, tagged with which provider produced it. */
export interface ResolvedEmail {
  provider: IntegrationProviderId;
  config: SmtpConfig;
}

/**
 * The notifications env, keyed by the env-var NAME the catalog descriptors reference. Explicit
 * (not dynamic `process.env` indexing) so the typed env accessor stays the single source (U19)
 * and there is no `any` (U4). Non-strings are stringified — the vault stores strings too, and
 * this function coerces once, below.
 */
function envByVarName(
  env: NotificationsEnv,
): Record<string, string | undefined> {
  return {
    SMTP_HOST: env.SMTP_HOST,
    SMTP_PORT: env.SMTP_PORT === undefined ? undefined : String(env.SMTP_PORT),
    SMTP_SECURE:
      env.SMTP_SECURE === undefined ? undefined : String(env.SMTP_SECURE),
    SMTP_USER: env.SMTP_USER,
    SMTP_PASSWORD: env.SMTP_PASSWORD,
    SMTP_FROM: env.SMTP_FROM,
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
      provider ? { capability: 'email', provider } : { capability: 'email' },
    );
  } catch {
    // Settings unreachable / no responder — fall through to the env fallback.
    return null;
  }
}

/**
 * THE email credentials seam (N13, capability→providers rework). Previously ONLY the password
 * came from the vault while host/port/user/from were hard-wired to service env — so email was
 * not actually configurable from the admin. Now every field resolves
 * **vault → notifications env → missing**, per the catalog descriptor's `envVar` (U9/F7), so an
 * env-configured deploy keeps working while anything set in the admin overrides it. Returns null
 * when a required field (host/port/from) is still missing — the provider then logs instead of
 * sending, exactly as before.
 */
export async function resolveEmailConfig(
  client: ClientProxy,
  env: NotificationsEnv,
  provider?: IntegrationProviderId,
): Promise<ResolvedEmail | null> {
  const resolved = await resolveFromVault(client, provider);
  const target = provider ?? resolved?.provider ?? DEFAULT_PROVIDER;
  const descriptor = getProviderDescriptor('email', target);
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

  const port = Number(values['port']);
  return {
    provider: target,
    config: {
      host: values['host'] ?? '',
      port: Number.isFinite(port) ? port : 587,
      secure: values['secure'] === 'true',
      user: values['user'],
      password: values['password'],
      from: values['from'] ?? '',
    },
  };
}
