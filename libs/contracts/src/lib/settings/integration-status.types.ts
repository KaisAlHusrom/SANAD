import type {
  IntegrationCapability,
  IntegrationProviderId,
} from './integration-catalog.js';

/**
 * The masked status of ONE provider field (N13). A secret field never returns its value —
 * only `last4` for recognition. A non-secret field (bucket, endpoint, host…) DOES return its
 * `value`, so the owner can see and edit what is configured.
 *
 * NOTE: this reports the **vault** only. The per-field env fallback is applied by the consuming
 * service (media/notifications own their own env, U19), so settings-service cannot see it — a
 * deploy configured purely by env therefore reads "not configured" here while still working.
 * "Test connection" is what proves the effective config.
 */
export interface IntegrationFieldStatus {
  key: string;
  isSet: boolean;
  /** Secret fields only — the last four characters of the stored value. */
  last4: string | null;
  /** Non-secret fields only — the plaintext value (null for secrets, never leaked). */
  value: string | null;
}

/** One provider's configuration state within its capability. */
export interface IntegrationProviderStatus {
  provider: IntegrationProviderId;
  /** True when every REQUIRED field is present in the vault — i.e. configured from the admin. */
  configured: boolean;
  fields: IntegrationFieldStatus[];
  updatedAt: string | null;
  updatedByUserId: string | null;
}

/** A capability card: which provider is active, and the state of each offered provider. */
export interface IntegrationCapabilityStatus {
  capability: IntegrationCapability;
  activeProvider: IntegrationProviderId | null;
  providers: IntegrationProviderStatus[];
}

/**
 * The decrypted config of one provider — crosses ONLY the internal broker to a consuming
 * service (media/notifications), never the API boundary (N13). Values are strings; the
 * consumer coerces by the field's declared type.
 */
export interface ResolvedIntegrationConfig {
  provider: IntegrationProviderId;
  values: Record<string, string>;
}

/**
 * The outcome of a provider connection test. `message` is **already localized** by the service
 * that ran the probe (it reads the forwarded `x-sanad-locale`, U24d) — this text sits inside the
 * payload, so the gateway envelope's renderer never sees it.
 *
 * `detail` carries the **vendor's own** technical text (`SignatureDoesNotMatch`, `ENOTFOUND`)
 * untranslated, rendered under the localized line: the owner keeps the diagnostic that says
 * WHICH key is wrong, while the UI still reads Arabic (U24e).
 */
export interface IntegrationTestResult {
  ok: boolean;
  message: string;
  detail?: string;
}
