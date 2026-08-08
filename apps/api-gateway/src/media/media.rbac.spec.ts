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
import { MEDIA_PERMISSIONS } from '@sanad/contracts';
import { MediaController } from './media.controller.js';

// A stand-in verifier (see branding.rbac.spec): the "token" encodes the granted
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

describe('media routes RBAC chain (P4 "Done when")', () => {
  it('admin (manage wildcard) may upload (media.manage)', () => {
    const ctx = context(bearer(['admin'], ['manage']));
    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(permGuardFor([MEDIA_PERMISSIONS.manage]).canActivate(ctx)).toBe(
      true,
    );
  });

  it('a holder of media.read may list but NOT upload', () => {
    const ctx = context(bearer(['developer'], [MEDIA_PERMISSIONS.read]));
    expect(authGuard.canActivate(ctx)).toBe(true);
    expect(permGuardFor([MEDIA_PERMISSIONS.read]).canActivate(ctx)).toBe(true);
    expectRejection(
      () => permGuardFor([MEDIA_PERMISSIONS.manage]).canActivate(ctx),
      HttpStatus.FORBIDDEN,
      'auth.forbidden',
    );
  });

  it('a user with neither permission is rejected with 403', () => {
    const ctx = context(bearer(['client'], []));
    expect(authGuard.canActivate(ctx)).toBe(true);
    expectRejection(
      () => permGuardFor([MEDIA_PERMISSIONS.read]).canActivate(ctx),
      HttpStatus.FORBIDDEN,
      'auth.forbidden',
    );
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

describe('public media resolver is UNGUARDED (WEB1)', () => {
  // Nest attaches @UseGuards via reflect-metadata under '__guards__' on the handler.
  const guardsOf = (method: keyof MediaController): unknown[] =>
    (Reflect.getMetadata('__guards__', MediaController.prototype[method]) ??
      []) as unknown[];

  it('GET /media/public carries NO guards (reachable without a token)', () => {
    expect(guardsOf('resolvePublic')).toHaveLength(0);
  });

  it('GET /media/:id is still guarded (media.read)', () => {
    expect(guardsOf('get').length).toBeGreaterThan(0);
  });
});
