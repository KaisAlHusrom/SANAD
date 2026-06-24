import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TokenVerifier,
  type AccessTokenPayload,
  type AuthenticatedRequest,
} from '@sanad/auth';
import { IDENTITY_PERMISSIONS } from '@sanad/contracts';

// A stand-in verifier: the "token" encodes the roles/permissions to grant. Real RS256
// verification is covered in @sanad/auth's JwtTokenVerifier spec — here we exercise
// the gateway's guard chain + the route's required permission.
class FakeVerifier extends TokenVerifier {
  verifyAccessToken(token: string): AccessTokenPayload {
    const claims = JSON.parse(token) as {
      roles: AccessTokenPayload['roles'];
      permissions: string[];
    };
    return {
      sub: 'user-1',
      roles: claims.roles,
      permissions: claims.permissions,
      type: 'access',
    };
  }
}

function bearer(roles: string[], permissions: string[]): AuthenticatedRequest {
  return {
    headers: {
      authorization: `Bearer ${JSON.stringify({ roles, permissions })}`,
    },
  };
}

function context(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class Route {},
  } as unknown as ExecutionContext;
}

// The route declares @RequirePermissions('identity.users.read').
const reflector = {
  getAllAndOverride: () => [IDENTITY_PERMISSIONS.usersRead],
} as unknown as Reflector;

const authGuard = new JwtAuthGuard(new FakeVerifier());
const permGuard = new PermissionsGuard(reflector);

describe('GET /api/identity/users RBAC chain (P2 "Done when")', () => {
  it('admin (manage wildcard) passes both guards', () => {
    const ctx = context(bearer(['admin'], ['manage']));
    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(permGuard.canActivate(ctx)).toBe(true);
  });

  it('a client lacking identity.users.read is rejected with 403', () => {
    const ctx = context(bearer(['client'], []));
    expect(authGuard.canActivate(ctx)).toBe(true); // authenticated…
    expect(() => permGuard.canActivate(ctx)).toThrow(ForbiddenException); // …not authorized
  });

  it('a missing token is rejected with 401', () => {
    const ctx = context({ headers: {} });
    expect(() => authGuard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
