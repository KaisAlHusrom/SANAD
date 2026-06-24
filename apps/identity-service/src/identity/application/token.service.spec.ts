import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { verify } from 'jsonwebtoken';
import { accessTokenPayloadSchema } from '@sanad/auth';
import type { IdentityEnv } from '../../env.js';
import { TokenService } from './token.service.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

const env = {
  JWT_PRIVATE_KEY: privateKey,
  JWT_PUBLIC_KEY: publicKey,
  JWT_ACCESS_TTL_MIN: 15,
  JWT_REFRESH_TTL_DAYS: 7,
} as IdentityEnv;

const service = new TokenService(env);

describe('TokenService (RS256)', () => {
  it('signs an access token carrying roles + permissions (decision 1)', () => {
    const token = service.signAccess({
      sub: 'u1',
      roles: ['admin'],
      permissions: ['manage'],
      email: 'a@b.co',
    });
    const decoded = verify(token, publicKey, { algorithms: ['RS256'] });
    const payload = accessTokenPayloadSchema.parse(decoded);
    expect(payload.sub).toBe('u1');
    expect(payload.permissions).toEqual(['manage']);
    expect(payload.type).toBe('access');
  });

  it('signs + verifies a refresh token round-trip with its jti', () => {
    const token = service.signRefresh('u1', 'jti-1');
    const payload = service.verifyRefresh(token);
    expect(payload.sub).toBe('u1');
    expect(payload.jti).toBe('jti-1');
    expect(payload.type).toBe('refresh');
  });

  it('rejects an access token presented to verifyRefresh (strict type)', () => {
    const access = service.signAccess({
      sub: 'u1',
      roles: ['admin'],
      permissions: [],
      email: 'a@b.co',
    });
    expect(() => service.verifyRefresh(access)).toThrow();
  });
});
