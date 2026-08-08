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

// A stand-in verifier (see branding.rbac.spec): the "token" encodes the granted claims.
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

function context(
  request: AuthenticatedRequest,
  required: string[],
): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class Route {},
    // PermissionsGuard reads the required permissions off the reflector.
    required,
  } as unknown as ExecutionContext;
}

function permGuard(required: string[]): PermissionsGuard {
  const reflector = {
    getAllAndOverride: () => required,
  } as unknown as Reflector;
  return new PermissionsGuard(reflector);
}

const authGuard = new JwtAuthGuard(new FakeVerifier());

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

describe('Settings gateway RBAC chains', () => {
  it('GET /api/settings requires settings.read (admin manage passes)', () => {
    const guard = permGuard([SETTINGS_PERMISSIONS.read]);
    const ctx = context(bearer(['admin'], ['manage']), [
      SETTINGS_PERMISSIONS.read,
    ]);
    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('GET /api/settings allows a holder of settings.read', () => {
    const guard = permGuard([SETTINGS_PERMISSIONS.read]);
    const ctx = context(bearer(['developer'], [SETTINGS_PERMISSIONS.read]), [
      SETTINGS_PERMISSIONS.read,
    ]);
    expect(authGuard.canActivate(ctx)).toBe(true); // attaches identity first
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('PUT /api/settings requires settings.manage (read-only is 403)', () => {
    const guard = permGuard([SETTINGS_PERMISSIONS.manage]);
    const ctx = context(bearer(['developer'], [SETTINGS_PERMISSIONS.read]), [
      SETTINGS_PERMISSIONS.manage,
    ]);
    expect(authGuard.canActivate(ctx)).toBe(true);
    expectRejection(
      () => guard.canActivate(ctx),
      HttpStatus.FORBIDDEN,
      'auth.forbidden',
    );
  });

  it('a missing token is rejected with 401', () => {
    const ctx = context({ headers: {} }, [SETTINGS_PERMISSIONS.read]);
    expectRejection(
      () => authGuard.canActivate(ctx),
      HttpStatus.UNAUTHORIZED,
      'auth.missingToken',
    );
  });
});
