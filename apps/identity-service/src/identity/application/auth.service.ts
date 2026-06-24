import { randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { z } from 'zod';
import { roleSchema, type Role } from '@sanad/auth';
import { DateTimeService } from '@sanad/database';
import type {
  AuthResult,
  AuthUser,
  LoginRequest,
  LogoutResult,
  RefreshRequest,
  TokenPair,
} from '@sanad/contracts';
import type { UserRow } from '../../db/schema/index.js';
import { RbacRepository } from '../infrastructure/rbac.repository.js';
import { RefreshTokenRepository } from '../infrastructure/refresh-token.repository.js';
import { UserRepository } from '../infrastructure/user.repository.js';
import { invalidCredentials, invalidRefreshToken } from './auth-errors.js';
import { PasswordHasher } from './password.hasher.js';
import { TokenService } from './token.service.js';

const roleListSchema = z.array(roleSchema);

/**
 * The auth workflow (decisions 1–3): credential login, refresh with rotation, and
 * logout. Resolves roles+permissions and mints an RS256 access token carrying them
 * (so the gateway authorizes at the edge), plus a persisted, hashed, single-use
 * refresh token. Thin message controllers delegate here (U5).
 */
@Injectable()
export class AuthService {
  constructor(
    private readonly users: UserRepository,
    private readonly rbac: RbacRepository,
    private readonly refreshTokens: RefreshTokenRepository,
    private readonly tokens: TokenService,
    private readonly hasher: PasswordHasher,
    private readonly clock: DateTimeService,
  ) {}

  async login(input: LoginRequest): Promise<AuthResult> {
    const user = await this.users.findByEmailWithSecret(input.email);
    if (!user || !user.isActive) {
      throw invalidCredentials();
    }
    const matches = await this.hasher.verify(user.password, input.password);
    if (!matches) {
      throw invalidCredentials();
    }
    return this.issueFor(user);
  }

  async refresh(input: RefreshRequest): Promise<TokenPair> {
    const payload = this.verifyRefresh(input.refresh);
    const row = await this.refreshTokens.findById(payload.jti);
    if (!row || row.revokedAt || row.expiresAt <= this.clock.nowIso()) {
      throw invalidRefreshToken();
    }
    const matches = await this.hasher.verify(row.tokenHash, input.refresh);
    if (!matches) {
      throw invalidRefreshToken();
    }
    const user = await this.users.findById(row.userId);
    if (!user || !user.isActive) {
      throw invalidRefreshToken();
    }
    // Rotate: revoke the presented token, issue a fresh pair.
    await this.refreshTokens.revoke(row.id);
    const result = await this.issueFor(user);
    return result.tokens;
  }

  async logout(input: RefreshRequest): Promise<LogoutResult> {
    try {
      const payload = this.verifyRefresh(input.refresh);
      const row = await this.refreshTokens.findById(payload.jti);
      if (row && !row.revokedAt) {
        await this.refreshTokens.revoke(row.id);
        return { revoked: true };
      }
    } catch {
      // A malformed/expired token is a no-op logout, not an error.
    }
    return { revoked: false };
  }

  private verifyRefresh(
    token: string,
  ): ReturnType<TokenService['verifyRefresh']> {
    try {
      return this.tokens.verifyRefresh(token);
    } catch {
      throw invalidRefreshToken();
    }
  }

  private async issueFor(user: UserRow): Promise<AuthResult> {
    const roles = roleListSchema.parse(
      await this.rbac.getUserRoleKeys(user.id),
    );
    const permissions = await this.rbac.getUserPermissionKeys(user.id);

    const access = this.tokens.signAccess({
      sub: user.id,
      roles,
      permissions,
      email: user.email,
    });

    const jti = randomUUID();
    const refresh = this.tokens.signRefresh(user.id, jti);
    const tokenHash = await this.hasher.hash(refresh);
    const expiresAt =
      this.clock
        .addDays(this.clock.now(), this.tokens.refreshDays)
        .toUTC()
        .toISO() ?? this.clock.nowIso();
    await this.refreshTokens.create({
      id: jti,
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    return { tokens: { access, refresh }, user: toAuthUser(user, roles) };
  }
}

function toAuthUser(user: UserRow, roles: Role[]): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roles,
    isActive: user.isActive,
  };
}
