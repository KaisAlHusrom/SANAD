import { generateKeyPairSync } from 'node:crypto';
import { sign } from 'jsonwebtoken';
import { describe, expect, it } from 'vitest';
import { JwtTokenVerifier } from './jwt-token-verifier.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

describe('JwtTokenVerifier (RS256)', () => {
  it('verifies a well-formed access token and returns validated claims', () => {
    const token = sign(
      {
        sub: 'user-1',
        roles: ['admin'],
        permissions: ['manage'],
        type: 'access',
      },
      privateKey,
      { algorithm: 'RS256', expiresIn: '15m' },
    );

    const verifier = new JwtTokenVerifier({ publicKey });
    const payload = verifier.verifyAccessToken(token);

    expect(payload.sub).toBe('user-1');
    expect(payload.permissions).toEqual(['manage']);
    expect(payload.type).toBe('access');
  });

  it('rejects a token signed by a different key', () => {
    const otherKey = generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: { type: 'spki', format: 'pem' },
      privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
    }).privateKey;
    const token = sign(
      { sub: 'u', roles: ['admin'], permissions: [], type: 'access' },
      otherKey,
      { algorithm: 'RS256' },
    );

    const verifier = new JwtTokenVerifier({ publicKey });
    expect(() => verifier.verifyAccessToken(token)).toThrow();
  });

  it('rejects a refresh token presented as an access token (strict type)', () => {
    const token = sign({ sub: 'u', jti: 'r1', type: 'refresh' }, privateKey, {
      algorithm: 'RS256',
    });
    const verifier = new JwtTokenVerifier({ publicKey });
    expect(() => verifier.verifyAccessToken(token)).toThrow();
  });
});
