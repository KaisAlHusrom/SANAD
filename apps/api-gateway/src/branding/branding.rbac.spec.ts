import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import { HttpException, HttpStatus, ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import {
  JwtAuthGuard,
  PermissionsGuard,
  TokenVerifier,
  type AccessTokenPayload,
  type AuthenticatedRequest,
} from '@sanad/auth';
import { SETTINGS_PERMISSIONS } from '@sanad/contracts';

// A stand-in verifier (see identity-users.rbac.spec): the "token" encodes the granted
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

// PUT /api/branding declares @RequirePermissions('settings.manage').
const reflector = {
  getAllAndOverride: () => [SETTINGS_PERMISSIONS.manage],
} as unknown as Reflector;

const authGuard = new JwtAuthGuard(new FakeVerifier());
const permGuard = new PermissionsGuard(reflector);

/**
 * The guards throw a keyed `HttpException` now (U24) — assert the STATUS + message KEY rather
 * than a Nest exception subclass, since the key is what the edge renders into ar/en.
 */
function expectRejection(
  run: () => unknown,
  status: HttpStatus,
  messageKey: string,
): void {
  try {
    run();
    expect.unreachable();
  } catch (error) {
    expect(error).toBeInstanceOf(HttpException);
    expect((error as HttpException).getStatus()).toBe(status);
    expect((error as HttpException).getResponse()).toMatchObject({
      messageKey,
    });
  }
}

describe('PUT /api/branding RBAC chain (P3 "Done when")', () => {
  it('admin (manage wildcard) passes both guards', () => {
    const ctx = context(bearer(['admin'], ['manage']));
    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(permGuard.canActivate(ctx)).toBe(true);
  });

  it('a holder of settings.manage passes', () => {
    const ctx = context(
      bearer(['business_manager'], [SETTINGS_PERMISSIONS.manage]),
    );
    expect(authGuard.canActivate(ctx)).toBe(true); // attaches identity first
    expect(permGuard.canActivate(ctx)).toBe(true);
  });

  it('a user lacking settings.manage is rejected with 403', () => {
    const ctx = context(bearer(['client'], []));
    expect(authGuard.canActivate(ctx)).toBe(true); // authenticated…
    expectRejection(
      () => permGuard.canActivate(ctx),
      HttpStatus.FORBIDDEN,
      'auth.forbidden',
    ); // …not authorized
  });

  it('a missing token is rejected with 401', () => {
    const ctx = context({ headers: {} });
    expectRejection(
      () => authGuard.canActivate(ctx),
      HttpStatus.UNAUTHORIZED,
      'auth.missingToken',
    );
  });
});
