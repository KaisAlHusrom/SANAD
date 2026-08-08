import 'reflect-metadata';
import { ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import type { IdentityContext } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { IntegrationPermissionGuard } from './integration-permission.guard.js';

interface IntegrationRequest {
  identity?: IdentityContext;
  params?: Record<string, string>;
}

function httpContext(request: IntegrationRequest): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
    getHandler: () => () => undefined,
    getClass: () => class Test {},
  } as unknown as ExecutionContext;
}

const guard = new IntegrationPermissionGuard();

/** Assert the guard threw the U24 shape: the right status carrying a message KEY, not prose. */
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
    const thrown = error as HttpException;
    expect(thrown.getStatus()).toBe(status);
    expect(thrown.getResponse()).toEqual({ statusCode: status, messageKey });
  }
}

describe('IntegrationPermissionGuard (N13 — per-capability RBAC)', () => {
  it('allows when the identity holds the capability manage permission', () => {
    const ctx = httpContext({
      params: { capability: 'email' },
      identity: {
        userId: 'u',
        roles: ['developer'],
        permissions: ['settings.integrations.email.manage'],
      },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('allows admin via the global manage wildcard', () => {
    const ctx = httpContext({
      params: { capability: 'storage' },
      identity: { userId: 'a', roles: ['admin'], permissions: ['manage'] },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('rejects when the identity lacks the capability permission (403)', () => {
    const ctx = httpContext({
      params: { capability: 'email' },
      identity: {
        userId: 'u',
        // even broad settings.manage does NOT grant an integration capability
        roles: ['business_manager'],
        permissions: ['settings.manage', 'settings.integrations.read'],
      },
    });
    expectRejection(
      () => guard.canActivate(ctx),
      HttpStatus.FORBIDDEN,
      'auth.forbidden',
    );
  });

  it("does not let one capability's permission manage another", () => {
    const ctx = httpContext({
      params: { capability: 'email' },
      identity: {
        userId: 'u',
        roles: ['developer'],
        permissions: ['settings.integrations.storage.manage'],
      },
    });
    expectRejection(
      () => guard.canActivate(ctx),
      HttpStatus.FORBIDDEN,
      'auth.forbidden',
    );
  });

  it('rejects when there is no identity (401), with a localizable key (U24)', () => {
    const ctx = httpContext({ params: { capability: 'storage' } });
    expectRejection(
      () => guard.canActivate(ctx),
      HttpStatus.UNAUTHORIZED,
      'auth.noIdentity',
    );
  });

  it('defers an unknown capability to the param pipe (returns true → 400 later)', () => {
    const ctx = httpContext({
      params: { capability: 'not-a-capability' },
      identity: { userId: 'u', roles: ['client'], permissions: [] },
    });
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
