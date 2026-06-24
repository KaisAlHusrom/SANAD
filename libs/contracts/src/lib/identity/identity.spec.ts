import { describe, expect, it } from 'vitest';
import { loginRequestSchema } from './login.zod.types.js';
import { refreshRequestSchema } from './refresh.zod.types.js';
import { IDENTITY_PERMISSIONS, permissionKey } from './permission.js';
import { IDENTITY_AUTH_LOGIN, IDENTITY_USERS_LIST } from './message-pattern.js';

describe('identity contracts', () => {
  it('accepts a valid login and rejects unknown keys (strict, N7)', () => {
    expect(
      loginRequestSchema.safeParse({ email: 'a@b.co', password: 'secret' })
        .success,
    ).toBe(true);
    expect(
      loginRequestSchema.safeParse({
        email: 'a@b.co',
        password: 'secret',
        role: 'admin',
      }).success,
    ).toBe(false);
  });

  it('rejects a malformed email and an empty password', () => {
    expect(
      loginRequestSchema.safeParse({ email: 'not-an-email', password: 'x' })
        .success,
    ).toBe(false);
    expect(
      loginRequestSchema.safeParse({ email: 'a@b.co', password: '' }).success,
    ).toBe(false);
  });

  it('requires a non-empty refresh token (matches the real refresh body, F1)', () => {
    expect(refreshRequestSchema.safeParse({ refresh: 'tok' }).success).toBe(
      true,
    );
    expect(refreshRequestSchema.safeParse({ refresh: '' }).success).toBe(false);
    expect(refreshRequestSchema.safeParse({}).success).toBe(false);
  });

  it('builds permission keys and exposes the identity catalog', () => {
    expect(permissionKey('identity.users', 'read')).toBe('identity.users.read');
    expect(IDENTITY_PERMISSIONS.usersRead).toBe('identity.users.read');
  });

  it('exposes stable request/reply patterns (MS2)', () => {
    expect(IDENTITY_AUTH_LOGIN).toBe('identity.auth.login');
    expect(IDENTITY_USERS_LIST).toBe('identity.users.list');
  });
});
