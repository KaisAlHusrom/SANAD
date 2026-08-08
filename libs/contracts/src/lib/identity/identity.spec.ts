import { describe, expect, it } from 'vitest';
import { loginRequestSchema } from './login.zod.types.js';
import { refreshRequestSchema } from './refresh.zod.types.js';
import { userCreateSchema } from './user-create.zod.types.js';
import { userUpdateSchema } from './user-update.zod.types.js';
import { userRoleAssignSchema } from './user-role-assign.zod.types.js';
import { IDENTITY_PERMISSIONS, permissionKey } from './permission.js';
import {
  IDENTITY_AUTH_LOGIN,
  IDENTITY_ROLES_LIST,
  IDENTITY_USERS_CREATE,
  IDENTITY_USERS_LIST,
} from './message-pattern.js';

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
    expect(IDENTITY_USERS_CREATE).toBe('identity.users.create');
    expect(IDENTITY_ROLES_LIST).toBe('identity.roles.list');
  });

  it('validates a user create: lowercases email, defaults, strict (N7)', () => {
    const parsed = userCreateSchema.safeParse({
      email: 'NEW@Sanad.Tech',
      name: 'New User',
      password: 'supersecret',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.email).toBe('new@sanad.tech');
      expect(parsed.data.isActive).toBe(true);
      expect(parsed.data.roles).toEqual([]);
    }
    // short password + unknown key rejected
    expect(
      userCreateSchema.safeParse({
        email: 'a@b.co',
        name: 'X',
        password: 'short',
      }).success,
    ).toBe(false);
    expect(
      userCreateSchema.safeParse({
        email: 'a@b.co',
        name: 'X',
        password: 'supersecret',
        extra: 1,
      }).success,
    ).toBe(false);
  });

  it('validates a user update (all profile fields optional, id required, strict)', () => {
    expect(
      userUpdateSchema.safeParse({ id: crypto.randomUUID() }).success,
    ).toBe(true);
    expect(
      userUpdateSchema.safeParse({ id: 'not-a-uuid', name: 'X' }).success,
    ).toBe(false);
  });

  it('validates a role assignment against the role enum (strict)', () => {
    const id = crypto.randomUUID();
    expect(
      userRoleAssignSchema.safeParse({ userId: id, role: 'developer' }).success,
    ).toBe(true);
    expect(
      userRoleAssignSchema.safeParse({ userId: id, role: 'wizard' }).success,
    ).toBe(false);
  });
});
