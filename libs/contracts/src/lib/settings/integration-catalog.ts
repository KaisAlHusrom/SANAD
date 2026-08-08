import { z } from 'zod';

/**
 * THE integrations model (N13, 2026-07-19 rework): a **capability** is something the platform
 * needs (storage, email); a **provider** is one concrete implementation of it (r2, smtp); each
 * provider declares its OWN field set. Exactly one provider per capability is *active* at a
 * time — the driver/disk pattern (Laravel `filesystems.php` `default` + `disks`; Strapi's
 * per-plugin provider + `providerOptions`).
 *
 * This replaces the old flat `SecretKey → feature` registry, which could only ever render one
 * row per credential and had no notion of "which provider am I using".
 *
 * Adding a provider (S3, Cloudinary, Anthropic…) = ONE entry here + an adapter in the owning
 * service. The gateway, the admin UI, and the RBAC seed are all derived from this catalog, so
 * they need no per-provider code. Only providers with a real consumer are listed (U15).
 */
export const integrationCapabilitySchema = z.enum(['storage', 'email']);
export type IntegrationCapability = z.infer<typeof integrationCapabilitySchema>;

/** Every provider id across all capabilities (a provider belongs to exactly one). */
export const integrationProviderIdSchema = z.enum(['r2', 'smtp']);
export type IntegrationProviderId = z.infer<typeof integrationProviderIdSchema>;

/** How a field renders in the admin + how its stored string is coerced by the consumer. */
export const integrationFieldTypeSchema = z.enum([
  'text',
  'password',
  'url',
  'number',
  'boolean',
  'email',
]);
export type IntegrationFieldType = z.infer<typeof integrationFieldTypeSchema>;

/**
 * One configurable field of a provider. `secret: true` → encrypted at rest (AES-256-GCM) and
 * only ever returned masked (`last4`); `secret: false` → stored in plaintext so the owner can
 * SEE and edit it (bucket, endpoint, host…). `envVar` is the consuming service's env variable
 * used as the fallback when the vault has no value (DB → env → null, the settings-with-defaults
 * pattern U9/F7), so existing env-configured deploys keep working untouched.
 */
export interface IntegrationFieldDescriptor {
  key: string;
  type: IntegrationFieldType;
  secret: boolean;
  required: boolean;
  envVar?: string;
}

/** One provider of a capability, plus the fields it needs to be usable. */
export interface IntegrationProviderDescriptor {
  id: IntegrationProviderId;
  capability: IntegrationCapability;
  fields: readonly IntegrationFieldDescriptor[];
}

const field = (
  key: string,
  type: IntegrationFieldType,
  opts: { secret?: boolean; required?: boolean; envVar?: string } = {},
): IntegrationFieldDescriptor => ({
  key,
  type,
  secret: opts.secret ?? false,
  required: opts.required ?? false,
  envVar: opts.envVar,
});

/** Cloudflare R2 (S3-compatible) — consumed by media-service. */
const R2: IntegrationProviderDescriptor = {
  id: 'r2',
  capability: 'storage',
  fields: [
    field('accountId', 'text', { required: true, envVar: 'R2_ACCOUNT_ID' }),
    field('bucket', 'text', { required: true, envVar: 'R2_BUCKET' }),
    field('accessKeyId', 'text', {
      required: true,
      envVar: 'R2_ACCESS_KEY_ID',
    }),
    field('secretAccessKey', 'password', {
      secret: true,
      required: true,
      envVar: 'R2_SECRET_ACCESS_KEY',
    }),
    field('endpoint', 'url', { required: true, envVar: 'R2_ENDPOINT' }),
    field('publicUrl', 'url', { required: true, envVar: 'R2_PUBLIC_URL' }),
  ],
};

/**
 * SMTP — consumed by notifications-service. The FULL connection set lives here: previously only
 * `SMTP_PASSWORD` was in the vault while host/port/user/from sat in service env, so email was
 * not actually configurable from the admin. Auth (`user`/`password`) is optional because some
 * relays accept unauthenticated sends; host/port/from are what make the transport usable.
 */
const SMTP: IntegrationProviderDescriptor = {
  id: 'smtp',
  capability: 'email',
  fields: [
    field('host', 'text', { required: true, envVar: 'SMTP_HOST' }),
    field('port', 'number', { required: true, envVar: 'SMTP_PORT' }),
    field('secure', 'boolean', { envVar: 'SMTP_SECURE' }),
    field('user', 'text', { envVar: 'SMTP_USER' }),
    field('password', 'password', { secret: true, envVar: 'SMTP_PASSWORD' }),
    field('from', 'text', { required: true, envVar: 'SMTP_FROM' }),
  ],
};

/** The full catalog, keyed by capability — the single source the whole stack derives from (U3). */
export const INTEGRATION_CATALOG: Record<
  IntegrationCapability,
  readonly IntegrationProviderDescriptor[]
> = {
  storage: [R2],
  email: [SMTP],
};

/** Capabilities in display order. */
export const INTEGRATION_CAPABILITIES: readonly IntegrationCapability[] =
  integrationCapabilitySchema.options;

/** The providers offered for a capability. */
export function listProviders(
  capability: IntegrationCapability,
): readonly IntegrationProviderDescriptor[] {
  return INTEGRATION_CATALOG[capability];
}

/** The descriptor for one provider, or `undefined` if it doesn't belong to that capability. */
export function getProviderDescriptor(
  capability: IntegrationCapability,
  provider: IntegrationProviderId,
): IntegrationProviderDescriptor | undefined {
  return INTEGRATION_CATALOG[capability].find((p) => p.id === provider);
}

/** The keys that must all resolve before a provider counts as configured. */
export function requiredFieldKeys(
  capability: IntegrationCapability,
  provider: IntegrationProviderId,
): string[] {
  return (getProviderDescriptor(capability, provider)?.fields ?? [])
    .filter((f) => f.required)
    .map((f) => f.key);
}

/** The keys stored encrypted + returned masked. */
export function secretFieldKeys(
  capability: IntegrationCapability,
  provider: IntegrationProviderId,
): string[] {
  return (getProviderDescriptor(capability, provider)?.fields ?? [])
    .filter((f) => f.secret)
    .map((f) => f.key);
}
