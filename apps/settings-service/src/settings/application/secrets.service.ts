import { Inject, Injectable } from '@nestjs/common';
import {
  SECRET_REGISTRY_LIST,
  type SecretKey,
  type SecretStatus,
} from '@sanad/contracts';
import { SETTINGS_ENV, type SettingsEnv } from '../../env.js';
import { IntegrationSecretRepository } from '../infrastructure/integration-secret.repository.js';
import { SecretCipherService } from './crypto/secret-cipher.service.js';

/**
 * Manages third-party integration secrets (N13): masked status, set/rotate/clear, and the
 * server-side resolve (decrypt) consumers use. Values are encrypted at rest (AES-256-GCM)
 * and NEVER returned to a client — the masked status carries only `last4` + audit. The
 * decrypted value crosses no public boundary; it is returned only over the internal RMQ
 * `settings.resolve-secret` reply (MS2). Resolution order: vault row → env fallback → null.
 *
 * Application layer (N14): depends on the repository + cipher only — never the `DRIZZLE`
 * handle.
 */
@Injectable()
export class SecretsService {
  /** Env-var fallbacks for the secrets that have an env name in the validated SettingsEnv. */
  private readonly envFallbacks: Partial<Record<SecretKey, string | undefined>>;

  constructor(
    private readonly secrets: IntegrationSecretRepository,
    private readonly cipher: SecretCipherService,
    @Inject(SETTINGS_ENV) env: SettingsEnv,
  ) {
    this.envFallbacks = { SMTP_PASSWORD: env.SMTP_PASSWORD };
  }

  /** Masked status of every registered secret (never a value) — the admin Integrations list. */
  async getStatuses(): Promise<SecretStatus[]> {
    const statuses: SecretStatus[] = [];
    for (const entry of SECRET_REGISTRY_LIST) {
      const row = await this.secrets.findByKey(entry.key);
      if (row) {
        statuses.push({
          key: entry.key,
          isSet: true,
          fromEnv: false,
          last4: row.last4,
          updatedAt: row.updatedAt.toISOString(),
          updatedByUserId: row.updatedByUserId,
        });
        continue;
      }
      const envValue = this.envFallbacks[entry.key];
      statuses.push(
        envValue
          ? {
              key: entry.key,
              isSet: true,
              fromEnv: true,
              last4: envValue.slice(-4),
              updatedAt: null,
              updatedByUserId: null,
            }
          : {
              key: entry.key,
              isSet: false,
              fromEnv: false,
              last4: null,
              updatedAt: null,
              updatedByUserId: null,
            },
      );
    }
    return statuses;
  }

  /** Encrypt + store (or rotate) a secret, recording who set it. Returns the masked status. */
  async setSecret(
    key: SecretKey,
    value: string,
    userId: string | null,
  ): Promise<SecretStatus> {
    const { ciphertext, iv, authTag } = this.cipher.encrypt(value);
    const last4 = value.slice(-4);
    const existing = await this.secrets.findByKey(key);
    if (existing) {
      await this.secrets.update(existing.id, {
        ciphertext,
        iv,
        authTag,
        last4,
        updatedByUserId: userId,
      });
    } else {
      await this.secrets.create({
        key,
        ciphertext,
        iv,
        authTag,
        last4,
        updatedByUserId: userId,
      });
    }
    return this.statusFor(key);
  }

  /** Clear (soft-delete) a secret. Resolution then falls through to env fallback → null. */
  async clearSecret(key: SecretKey): Promise<void> {
    const existing = await this.secrets.findByKey(key);
    if (existing) {
      await this.secrets.delete(existing.id);
    }
  }

  /** Decrypt + return the plaintext for a consumer (server-side only): vault → env → null. */
  async resolveSecret(key: SecretKey): Promise<string | null> {
    const row = await this.secrets.findByKeyWithSecret(key);
    if (row) {
      return this.cipher.decrypt({
        ciphertext: row.ciphertext,
        iv: row.iv,
        authTag: row.authTag,
      });
    }
    return this.envFallbacks[key] ?? null;
  }

  /** The masked status of a single key (used after a write). */
  private async statusFor(key: SecretKey): Promise<SecretStatus> {
    const all = await this.getStatuses();
    return (
      all.find((status) => status.key === key) ?? {
        key,
        isSet: false,
        fromEnv: false,
        last4: null,
        updatedAt: null,
        updatedByUserId: null,
      }
    );
  }
}
