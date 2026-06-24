import { generateKeyPairSync } from 'node:crypto';
import { describe, expect, it, vi } from 'vitest';
import { verify } from 'jsonwebtoken';
import { accessTokenPayloadSchema } from '@sanad/auth';
import { DateTimeService } from '@sanad/database';
import type { IdentityEnv } from '../../env.js';
import type { UserRow } from '../../db/schema/index.js';
import type { RbacRepository } from '../infrastructure/rbac.repository.js';
import type {
  NewRefreshToken,
  RefreshTokenRepository,
} from '../infrastructure/refresh-token.repository.js';
import type { UserRepository } from '../infrastructure/user.repository.js';
import { AuthService } from './auth.service.js';
import type { PasswordHasher } from './password.hasher.js';
import { TokenService } from './token.service.js';

const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
const tokens = new TokenService({
  JWT_PRIVATE_KEY: privateKey,
  JWT_PUBLIC_KEY: publicKey,
  JWT_ACCESS_TTL_MIN: 15,
  JWT_REFRESH_TTL_DAYS: 7,
} as IdentityEnv);
const clock = DateTimeService.fixed('2026-06-22T10:00:00.000Z');

const adminUser: UserRow = {
  id: 'u1',
  email: 'admin@sanad.tech',
  password: 'argon-hash',
  name: 'Administrator',
  isActive: true,
  createdAt: new Date(0),
  updatedAt: new Date(0),
  deletedAt: null,
};

function fakes(overrides?: {
  verify?: boolean;
  storedToken?: NewRefreshToken & {
    revokedAt: string | null;
    expiresAt: string;
  };
}) {
  const created: NewRefreshToken[] = [];
  const revoked: string[] = [];
  const users = {
    findByEmailWithSecret: vi.fn(async () => adminUser),
    findById: vi.fn(async () => adminUser),
  } as unknown as UserRepository;
  const rbac = {
    getUserRoleKeys: vi.fn(async () => ['admin']),
    getUserPermissionKeys: vi.fn(async () => ['manage']),
  } as unknown as RbacRepository;
  const refreshTokens = {
    create: vi.fn(async (input: NewRefreshToken) => {
      created.push(input);
    }),
    findById: vi.fn(async () => overrides?.storedToken ?? null),
    revoke: vi.fn(async (id: string) => {
      revoked.push(id);
    }),
  } as unknown as RefreshTokenRepository;
  const hasher = {
    hash: vi.fn(async () => 'new-hash'),
    verify: vi.fn(async () => overrides?.verify ?? true),
  } as unknown as PasswordHasher;
  const service = new AuthService(
    users,
    rbac,
    refreshTokens,
    tokens,
    hasher,
    clock,
  );
  return { service, users, refreshTokens, hasher, created, revoked };
}

describe('AuthService.login', () => {
  it('issues an access token with resolved roles + permissions and persists a refresh', async () => {
    const { service, created } = fakes();
    const result = await service.login({
      email: 'admin@sanad.tech',
      password: 'secret',
    });

    const payload = accessTokenPayloadSchema.parse(
      verify(result.tokens.access, publicKey, { algorithms: ['RS256'] }),
    );
    expect(payload.roles).toEqual(['admin']);
    expect(payload.permissions).toEqual(['manage']);
    expect(result.user.email).toBe('admin@sanad.tech');
    expect(created).toHaveLength(1);
  });

  it('rejects a wrong password', async () => {
    const { service } = fakes({ verify: false });
    await expect(
      service.login({ email: 'admin@sanad.tech', password: 'nope' }),
    ).rejects.toThrow();
  });
});

describe('AuthService.refresh', () => {
  it('rotates: revokes the presented token and issues a new pair', async () => {
    const refresh = tokens.signRefresh('u1', 'jti-1');
    const { service, revoked, created } = fakes({
      verify: true,
      storedToken: {
        id: 'jti-1',
        userId: 'u1',
        tokenHash: 'argon',
        revokedAt: null,
        expiresAt: '2026-12-01T00:00:00.000Z',
      },
    });

    const pair = await service.refresh({ refresh });

    expect(revoked).toEqual(['jti-1']);
    expect(created).toHaveLength(1);
    expect(pair.access).toBeTypeOf('string');
  });

  it('rejects a revoked refresh token', async () => {
    const refresh = tokens.signRefresh('u1', 'jti-1');
    const { service } = fakes({
      verify: true,
      storedToken: {
        id: 'jti-1',
        userId: 'u1',
        tokenHash: 'argon',
        revokedAt: '2026-06-22T09:00:00.000Z',
        expiresAt: '2026-12-01T00:00:00.000Z',
      },
    });
    await expect(service.refresh({ refresh })).rejects.toThrow();
  });
});

describe('AuthService.logout', () => {
  it('revokes the token row and reports revoked', async () => {
    const refresh = tokens.signRefresh('u1', 'jti-1');
    const { service, revoked } = fakes({
      storedToken: {
        id: 'jti-1',
        userId: 'u1',
        tokenHash: 'argon',
        revokedAt: null,
        expiresAt: '2026-12-01T00:00:00.000Z',
      },
    });
    const result = await service.logout({ refresh });
    expect(result.revoked).toBe(true);
    expect(revoked).toEqual(['jti-1']);
  });
});
