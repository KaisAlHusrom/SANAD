import { HttpStatus, Injectable } from '@nestjs/common';
import {
  getProviderDescriptor,
  INTEGRATION_CAPABILITIES,
  INTEGRATION_CATALOG,
  type IntegrationCapability,
  type IntegrationCapabilityStatus,
  type IntegrationFieldDescriptor,
  type IntegrationFieldStatus,
  type IntegrationProviderId,
  type IntegrationProviderStatus,
  type IntegrationValues,
  type ResolvedIntegrationConfig,
} from '@sanad/contracts';
import { rpcError } from '@sanad/i18n';
import type { IntegrationConfigRow } from '../../db/schema/index.js';
import { IntegrationActiveProviderRepository } from '../infrastructure/integration-active-provider.repository.js';
import { IntegrationConfigRepository } from '../infrastructure/integration-config.repository.js';
import { SecretCipherService } from './crypto/secret-cipher.service.js';

/** Key a row by its field name for O(1) lookup while assembling a provider's status. */
function byFieldKey(
  rows: IntegrationConfigRow[],
): Map<string, IntegrationConfigRow> {
  return new Map(rows.map((row) => [row.fieldKey, row]));
}

/**
 * The integrations vault (N13) — the capability→providers→active model. Replaces the flat
 * `SecretsService`, which knew only global credential keys.
 *
 * Storage split per the catalog descriptor: **secret** fields are AES-256-GCM encrypted (only
 * `last4` is ever returned); **non-secret** fields are plaintext so the owner can see and edit
 * them. Decrypted values leave this service ONLY over the internal `settings.integration.resolve`
 * reply (MS2) — never across the API boundary.
 *
 * Application layer (N14): depends on repositories + the cipher only, never the `DRIZZLE` handle.
 */
@Injectable()
export class IntegrationsService {
  constructor(
    private readonly configs: IntegrationConfigRepository,
    private readonly active: IntegrationActiveProviderRepository,
    private readonly cipher: SecretCipherService,
  ) {}

  /**
   * The whole admin surface: every capability, its active provider, and each offered provider's
   * masked field state. Two queries per capability at most (rows + actives), never per-field.
   */
  async getStatuses(): Promise<IntegrationCapabilityStatus[]> {
    const actives = await this.active.listAll();
    const activeByCapability = new Map(
      actives.map((row) => [row.capability, row.provider]),
    );

    const statuses: IntegrationCapabilityStatus[] = [];
    for (const capability of INTEGRATION_CAPABILITIES) {
      const rows = await this.configs.listByCapability(capability);
      const providers = INTEGRATION_CATALOG[capability].map((descriptor) =>
        this.providerStatus(
          descriptor.id,
          descriptor.fields,
          rows.filter((row) => row.provider === descriptor.id),
        ),
      );
      const activeProvider = activeByCapability.get(capability) ?? null;
      statuses.push({
        capability,
        activeProvider: activeProvider as IntegrationProviderId | null,
        providers,
      });
    }
    return statuses;
  }

  /**
   * Upsert the submitted fields of one provider. A field ABSENT from `values` is left untouched
   * (this is how a masked secret survives an edit that didn't retype it); an explicit `null`/`''`
   * clears it. Unknown field keys are rejected — the catalog is the contract (N7).
   */
  async configureProvider(
    capability: IntegrationCapability,
    provider: IntegrationProviderId,
    values: IntegrationValues,
    userId: string | null,
  ): Promise<void> {
    const descriptor = getProviderDescriptor(capability, provider);
    if (!descriptor) {
      throw rpcError(HttpStatus.BAD_REQUEST, 'settings.unknownProvider', {
        provider,
        capability,
      });
    }
    const fields = new Map(descriptor.fields.map((f) => [f.key, f]));
    for (const key of Object.keys(values)) {
      if (!fields.has(key)) {
        throw rpcError(HttpStatus.BAD_REQUEST, 'settings.unknownField', {
          field: key,
          provider,
        });
      }
    }

    for (const [key, raw] of Object.entries(values)) {
      const field = fields.get(key);
      if (!field) continue;
      const existing = await this.configs.findField(capability, provider, key);
      const value = raw?.trim() ?? '';

      if (value === '') {
        // Explicitly cleared — drop the live row; the field falls back to the consumer's env.
        if (existing) await this.configs.delete(existing.id);
        continue;
      }

      const payload = field.secret
        ? {
            ...this.cipher.encrypt(value),
            last4: value.slice(-4),
            value: null,
          }
        : { value, ciphertext: null, iv: null, authTag: null, last4: null };

      if (existing) {
        await this.configs.update(existing.id, {
          ...payload,
          updatedByUserId: userId,
        });
      } else {
        await this.configs.create({
          capability,
          provider,
          fieldKey: key,
          ...payload,
          updatedByUserId: userId,
        });
      }
    }
  }

  /** Point a capability at one of ITS providers (rejects a provider from another capability). */
  async activateProvider(
    capability: IntegrationCapability,
    provider: IntegrationProviderId,
    userId: string | null,
  ): Promise<void> {
    if (!getProviderDescriptor(capability, provider)) {
      throw rpcError(HttpStatus.BAD_REQUEST, 'settings.unknownProvider', {
        provider,
        capability,
      });
    }
    await this.active.setActive(capability, provider, userId);
  }

  /**
   * Decrypt + return one provider's config for a consuming service (server-side only, N13).
   * Omit `provider` for the capability's ACTIVE provider; pass one to resolve a specific
   * provider (what "Test connection" needs before that provider is activated). Returns null
   * when the capability has no active provider.
   */
  async resolveConfig(
    capability: IntegrationCapability,
    provider?: IntegrationProviderId,
  ): Promise<ResolvedIntegrationConfig | null> {
    const target =
      provider ??
      ((await this.active.findByCapability(capability))?.provider as
        | IntegrationProviderId
        | undefined);
    if (!target || !getProviderDescriptor(capability, target)) {
      return null;
    }

    const rows = await this.configs.listByProviderWithSecret(
      capability,
      target,
    );
    const values: Record<string, string> = {};
    for (const row of rows) {
      if (row.ciphertext && row.iv && row.authTag) {
        values[row.fieldKey] = this.cipher.decrypt({
          ciphertext: row.ciphertext,
          iv: row.iv,
          authTag: row.authTag,
        });
      } else if (row.value !== null) {
        values[row.fieldKey] = row.value;
      }
    }
    return { provider: target, values };
  }

  /** Masked state of one provider: per-field status + whether every required field is present. */
  private providerStatus(
    provider: IntegrationProviderId,
    descriptors: readonly IntegrationFieldDescriptor[],
    rows: IntegrationConfigRow[],
  ): IntegrationProviderStatus {
    const rowByKey = byFieldKey(rows);
    const fields: IntegrationFieldStatus[] = descriptors.map((descriptor) => {
      const row = rowByKey.get(descriptor.key);
      return {
        key: descriptor.key,
        isSet: Boolean(row),
        last4: descriptor.secret ? (row?.last4 ?? null) : null,
        value: descriptor.secret ? null : (row?.value ?? null),
      };
    });

    const configured = descriptors
      .filter((descriptor) => descriptor.required)
      .every((descriptor) => rowByKey.has(descriptor.key));

    // The provider's audit stamp = its most recently touched field (N3 — the column is already
    // a Date; never construct one here).
    const latest = rows.reduce<IntegrationConfigRow | null>(
      (newest, row) =>
        !newest || row.updatedAt > newest.updatedAt ? row : newest,
      null,
    );

    return {
      provider,
      configured,
      fields,
      updatedAt: latest?.updatedAt.toISOString() ?? null,
      updatedByUserId: latest?.updatedByUserId ?? null,
    };
  }
}
