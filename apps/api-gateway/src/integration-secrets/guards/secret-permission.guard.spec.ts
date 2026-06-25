import 'reflect-metadata';
import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import type { IdentityContext } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { SecretPermissionGuard } from './secret-permission.guard.js';

interface SecretRequest {
  identity?: IdentityContext;
  params?: Record<string, string>;
}

function httpContext(request: SecretRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class Test {},
  } as unknown as ExecutionContext;
}

const guard = new SecretPermissionGuard();

describe('SecretPermissionGuard (N13 — per-integration RBAC)', () => {
  it('allows when the identity holds the feature manage permission', () => {
    const ctx = httpContext({
      params: { key: 'SMTP_PASSWORD' },
      identity: {
        userId: 'u',
        roles: ['developer'],
        permissions: ['settings.secrets.email.manage'],
      },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows admin via the global manage wildcard', () => {
    const ctx = httpContext({
      params: { key: 'R2_SECRET_KEY' },
      identity: { userId: 'a', roles: ['admin'], permissions: ['manage'] },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when the identity lacks the feature permission (403)', () => {
    const ctx = httpContext({
      params: { key: 'SMTP_PASSWORD' },
      identity: {
        userId: 'u',
        // even broad settings.manage does NOT grant the per-integration secret key
        roles: ['business_manager'],
        permissions: ['settings.manage', 'settings.secrets.read'],
      },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it("does not let one feature's permission manage another", () => {
    const ctx = httpContext({
      params: { key: 'SMTP_PASSWORD' },
      identity: {
        userId: 'u',
        roles: ['developer'],
        permissions: ['settings.secrets.storage.manage'],
      },
    });
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('rejects when there is no identity (401)', () => {
    const ctx = httpContext({ params: { key: 'SMTP_PASSWORD' } });
    expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
  });

  it('defers an unknown key to the param pipe (returns true → 400 later)', () => {
    const ctx = httpContext({
      params: { key: 'NOT_A_SECRET' },
      identity: { userId: 'u', roles: ['client'], permissions: [] },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
