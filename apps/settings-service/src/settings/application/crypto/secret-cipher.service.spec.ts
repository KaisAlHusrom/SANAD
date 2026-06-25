import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import type { SettingsEnv } from '../../../env.js';
import { SecretCipherService } from './secret-cipher.service.js';

/** base64 of a 32-byte key (matches the dev default). */
const KEY = 'c2FuYWQtZGV2LXNlY3JldHMtZW5jcnlwdGlvbi1rZXk=';

function cipher(key = KEY): SecretCipherService {
  return new SecretCipherService({
    APP_SECRETS_ENCRYPTION_KEY: key,
  } as SettingsEnv);
}

describe('SecretCipherService (AES-256-GCM, N13)', () => {
  it('round-trips: decrypt(encrypt(x)) === x', () => {
    const c = cipher();
    const enc = c.encrypt('super-secret-smtp-pw');
    expect(c.decrypt(enc)).toBe('super-secret-smtp-pw');
  });

  it('uses a fresh IV so identical plaintexts never produce identical ciphertext', () => {
    const c = cipher();
    const a = c.encrypt('same');
    const b = c.encrypt('same');
    expect(a.iv).not.toBe(b.iv);
    expect(a.ciphertext).not.toBe(b.ciphertext);
    expect(c.decrypt(a)).toBe('same');
    expect(c.decrypt(b)).toBe('same');
  });

  it('rejects tampered ciphertext or auth tag (GCM tamper detection)', () => {
    const c = cipher();
    const enc = c.encrypt('value');
    expect(() =>
      c.decrypt({
        ...enc,
        ciphertext: Buffer.from('tampered').toString('base64'),
      }),
    ).toThrow();
    expect(() =>
      c.decrypt({ ...enc, authTag: Buffer.alloc(16).toString('base64') }),
    ).toThrow();
  });

  it('rejects a key that does not decode to 32 bytes', () => {
    expect(() => cipher(Buffer.from('too-short').toString('base64'))).toThrow(
      /32 bytes/,
    );
  });
});
