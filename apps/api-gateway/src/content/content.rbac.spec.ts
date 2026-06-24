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
import { CONTENT_PERMISSIONS } from '@sanad/contracts';

// A stand-in verifier (see media.rbac.spec): the "token" encodes the granted
// roles/permissions. Real RS256 verification lives in @sanad/auth's verifier spec.
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

const authGuard = new JwtAuthGuard(new FakeVerifier());

function permGuardFor(required: string[]): PermissionsGuard {
  const reflector = {
    getAllAndOverride: () => required,
  } as unknown as Reflector;
  return new PermissionsGuard(reflector);
}

describe('content routes RBAC chain (P5 "Done when")', () => {
  it('admin (manage wildcard) may manage content', () => {
    const ctx = context(bearer(['admin'], ['manage']));
    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(permGuardFor([CONTENT_PERMISSIONS.manage]).canActivate(ctx)).toBe(
      true,
    );
  });

  it('a holder of content.read may read but NOT manage', () => {
    const ctx = context(bearer(['blog_writer'], [CONTENT_PERMISSIONS.read]));
    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(permGuardFor([CONTENT_PERMISSIONS.read]).canActivate(ctx)).toBe(
      true,
    );
    expect(() =>
      permGuardFor([CONTENT_PERMISSIONS.manage]).canActivate(ctx),
    ).toThrow(ForbiddenException);
  });

  it('a content.manage holder may manage', () => {
    const ctx = context(bearer(['blog_writer'], [CONTENT_PERMISSIONS.manage]));
    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(permGuardFor([CONTENT_PERMISSIONS.manage]).canActivate(ctx)).toBe(
      true,
    );
  });

  it('a user with neither permission is rejected with 403', () => {
    const ctx = context(bearer(['client'], []));
    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(() =>
      permGuardFor([CONTENT_PERMISSIONS.manage]).canActivate(ctx),
    ).toThrow(ForbiddenException);
  });

  it('a missing token is rejected with 401 (the guarded writes)', () => {
    const ctx = context({ headers: {} });
    expect(() => authGuard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
