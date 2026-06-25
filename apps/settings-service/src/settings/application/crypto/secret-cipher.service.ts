import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { SETTINGS_ENV, type SettingsEnv } from '../../../env.js';

/** The encrypted form of a secret — ciphertext plus the per-encryption IV and GCM auth tag, all base64. */
export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  authTag: string;
}

const ALGORITHM = 'aes-256-gcm';
const KEY_BYTES = 32;
const IV_BYTES = 12; // GCM standard nonce length

/**
 * AES-256-GCM encryption for third-party integration credentials at rest (N13). The master
 * key comes from `APP_SECRETS_ENCRYPTION_KEY` (the one infra secret kept in env). A fresh
 * random IV is generated per `encrypt` so identical plaintexts never produce identical
 * ciphertext; the GCM auth tag is stored alongside and verified on `decrypt` (tamper
 * detection). Plaintext is NEVER logged. Owned by the settings-service (only it
 * encrypts/decrypts — resolution is server-side via RMQ). Uses `randomBytes` only, no clock.
 */
@Injectable()
export class SecretCipherService {
  private readonly key: Buffer;

  constructor(@Inject(SETTINGS_ENV) env: SettingsEnv) {
    const key = Buffer.from(env.APP_SECRETS_ENCRYPTION_KEY, 'base64');
    if (key.length !== KEY_BYTES) {
      throw new Error(
        `APP_SECRETS_ENCRYPTION_KEY must decode to ${KEY_BYTES} bytes (got ${key.length}); expected base64 of a 32-byte key.`,
      );
    }
    this.key = key;
  }

  encrypt(plaintext: string): EncryptedSecret {
    const iv = randomBytes(IV_BYTES);
    const cipher = createCipheriv(ALGORITHM, this.key, iv);
    const ciphertext = Buffer.concat([
      cipher.update(plaintext, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();
    return {
      ciphertext: ciphertext.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(secret: EncryptedSecret): string {
    const decipher = createDecipheriv(
      ALGORITHM,
      this.key,
      Buffer.from(secret.iv, 'base64'),
    );
    decipher.setAuthTag(Buffer.from(secret.authTag, 'base64'));
    const plaintext = Buffer.concat([
      decipher.update(Buffer.from(secret.ciphertext, 'base64')),
      decipher.final(),
    ]);
    return plaintext.toString('utf8');
  }
}
