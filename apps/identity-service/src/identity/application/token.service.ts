import { Inject, Injectable } from '@nestjs/common';
// jsonwebtoken is CJS — default-import the module object (named exports aren't
// reliably exposed to Node's ESM loader).
import jwt from 'jsonwebtoken';
import {
  refreshTokenPayloadSchema,
  type RefreshTokenPayload,
  type Role,
} from '@sanad/auth';
import { IDENTITY_ENV, type IdentityEnv } from '../../env.js';

/** Claims baked into a signed access token. */
export interface AccessClaims {
  sub: string;
  roles: Role[];
  permissions: string[];
  email: string;
}

/**
 * Signs + verifies JWTs with RS256 (decision 2). Identity holds the private key and
 * signs; the gateway verifies with the public key. The access token carries the
 * resolved authorization claims (short-lived); the refresh token carries only the
 * `jti` of its persisted row.
 */
@Injectable()
export class TokenService {
  private readonly privateKey: string;
  private readonly publicKey: string;
  private readonly accessTtlMin: number;
  private readonly refreshTtlDays: number;

  constructor(@Inject(IDENTITY_ENV) env: IdentityEnv) {
    this.privateKey = env.JWT_PRIVATE_KEY;
    this.publicKey = env.JWT_PUBLIC_KEY;
    this.accessTtlMin = env.JWT_ACCESS_TTL_MIN;
    this.refreshTtlDays = env.JWT_REFRESH_TTL_DAYS;
  }

  /** How long refresh tokens live (days) — used to set the persisted `expires_at`. */
  get refreshDays(): number {
    return this.refreshTtlDays;
  }

  signAccess(claims: AccessClaims): string {
    return jwt.sign({ ...claims, type: 'access' }, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: `${this.accessTtlMin}m`,
    });
  }

  signRefresh(sub: string, jti: string): string {
    return jwt.sign({ sub, jti, type: 'refresh' }, this.privateKey, {
      algorithm: 'RS256',
      expiresIn: `${this.refreshTtlDays}d`,
    });
  }

  /** Verify a refresh token's signature + shape; throws if invalid/expired/tampered. */
  verifyRefresh(token: string): RefreshTokenPayload {
    const decoded = jwt.verify(token, this.publicKey, {
      algorithms: ['RS256'],
    });
    return refreshTokenPayloadSchema.parse(decoded);
  }
}
