import { describe, expect, it } from 'vitest';
import {
  hasAllRoles,
  hasAnyRole,
  hasPermission,
  hasRole,
  identityHasPermission,
  isStaff,
} from './rbac.js';
import { identityContextSchema } from './identity-context.js';

const admin = identityContextSchema.parse({
  userId: 'u1',
  roles: ['admin'],
});
const client = identityContextSchema.parse({
  userId: 'u2',
  roles: ['client'],
});

describe('rbac', () => {
  it('checks single and multi-role membership', () => {
    expect(hasRole(admin, 'admin')).toBe(true);
    expect(hasRole(admin, 'developer')).toBe(false);
    expect(hasAnyRole(admin, ['developer', 'admin'])).toBe(true);
    expect(hasAllRoles(admin, ['admin', 'developer'])).toBe(false);
  });

  it('distinguishes staff from clients', () => {
    expect(isStaff(admin)).toBe(true);
    expect(isStaff(client)).toBe(false);
  });
});

describe('hasPermission (wildcards)', () => {
  it('matches an exact permission', () => {
    expect(hasPermission(['identity.users.read'], 'identity.users.read')).toBe(
      true,
    );
    expect(
      hasPermission(['identity.users.read'], 'identity.users.update'),
    ).toBe(false);
  });

  it('grants everything to the global manage permission', () => {
    expect(hasPermission(['manage'], 'identity.users.read')).toBe(true);
    expect(hasPermission(['manage'], 'content.pages.update')).toBe(true);
  });

  it('grants every action on a resource via <resource>.manage', () => {
    expect(
      hasPermission(['identity.users.manage'], 'identity.users.read'),
    ).toBe(true);
    expect(
      hasPermission(['identity.users.manage'], 'identity.users.delete'),
    ).toBe(true);
    // resource wildcard does NOT leak to a different resource
    expect(
      hasPermission(['identity.users.manage'], 'identity.roles.read'),
    ).toBe(false);
  });

  it('fails closed on empty grants', () => {
    expect(hasPermission([], 'identity.users.read')).toBe(false);
  });

  it('reads permissions off an identity context', () => {
    const staff = identityContextSchema.parse({
      userId: 'u3',
      roles: ['developer'],
      permissions: ['identity.users.read'],
    });
    expect(identityHasPermission(staff, 'identity.users.read')).toBe(true);
    expect(identityHasPermission(staff, 'identity.users.delete')).toBe(false);
  });
});

describe('identity-context schema', () => {
  it('defaults permissions to an empty array when omitted', () => {
    const parsed = identityContextSchema.parse({
      userId: 'u',
      roles: ['admin'],
    });
    expect(parsed.permissions).toEqual([]);
  });

  it('rejects unknown keys and empty roles', () => {
    expect(
      identityContextSchema.safeParse({ userId: 'u', roles: [] }).success,
    ).toBe(false);
    expect(
      identityContextSchema.safeParse({ userId: 'u', roles: ['admin'], x: 1 })
        .success,
    ).toBe(false);
  });
});
