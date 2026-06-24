import 'reflect-metadata';
import { describe, expect, it } from 'vitest';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { AccessTokenPayload } from '../../jwt-payload.js';
import type { AuthenticatedRequest } from '../types/authenticated-request.js';
import { TokenVerifier } from '../verifiers/token-verifier.js';
import { JwtAuthGuard } from './jwt-auth.guard.js';
import { PermissionsGuard } from './permissions.guard.js';

function httpContext(request: AuthenticatedRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class Test {},
  } as unknown as ExecutionContext;
}

const accessPayload: AccessTokenPayload = {
  sub: 'user-1',
  roles: ['admin'],
  permissions: ['identity.users.read'],
  email: 'admin@sanad.tech',
  type: 'access',
};

class FakeVerifier extends TokenVerifier {
  constructor(private readonly behavior: 'ok' | 'throw') {
    super();
  }
  verifyAccessToken(): AccessTokenPayload {
    if (this.behavior === 'throw') {
      throw new Error('bad token');
    }
    return accessPayload;
  }
}

describe('JwtAuthGuard', () => {
  it('rejects a request with no bearer token (401)', () => {
    const guard = new JwtAuthGuard(new FakeVerifier('ok'));
    const ctx = httpContext({ headers: {} });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('rejects an invalid token (401)', () => {
    const guard = new JwtAuthGuard(new FakeVerifier('throw'));
    const ctx = httpContext({ headers: { authorization: 'Bearer bad' } });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('attaches the identity context on a valid token', () => {
    const guard = new JwtAuthGuard(new FakeVerifier('ok'));
    const request: AuthenticatedRequest = {
      headers: { authorization: 'Bearer good' },
    };
    expect(guard.canActivate(httpContext(request))).toBe(true);
    expect(request.identity?.userId).toBe('user-1');
    expect(request.identity?.permissions).toEqual(['identity.users.read']);
  });
});

describe('PermissionsGuard', () => {
  const reflectorReturning = (required: string[] | undefined): Reflector =>
    ({ getAllAndOverride: () => required }) as unknown as Reflector;

  it('allows when no permissions are declared', () => {
    const guard = new PermissionsGuard(reflectorReturning(undefined));
    const ctx = httpContext({ headers: {} });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows when the identity satisfies the required permission', () => {
    const guard = new PermissionsGuard(
      reflectorReturning(['identity.users.read']),
    );
    const ctx = httpContext({
      headers: {},
      identity: {
        userId: 'u',
        roles: ['developer'],
        permissions: ['identity.users.read'],
      },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when the identity lacks the permission (403)', () => {
    const guard = new PermissionsGuard(
      reflectorReturning(['identity.users.read']),
    );
    const ctx = httpContext({
      headers: {},
      identity: { userId: 'u', roles: ['client'], permissions: [] },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects when there is no identity (401)', () => {
    const guard = new PermissionsGuard(
      reflectorReturning(['identity.users.read']),
    );
    const ctx = httpContext({ headers: {} });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });
});
