import { describe, expect, it } from 'vitest';
import { hasAllRoles, hasAnyRole, hasRole, isStaff } from './rbac.js';
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

describe('identity-context schema', () => {
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
