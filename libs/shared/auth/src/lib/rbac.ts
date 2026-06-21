import type { IdentityContext } from './identity-context.js';
import { isStaffRole, type Role } from './role.js';

/** True when the identity holds the given role. */
export function hasRole(identity: IdentityContext, role: Role): boolean {
  return identity.roles.includes(role);
}

/** True when the identity holds at least one of the given roles. */
export function hasAnyRole(
  identity: IdentityContext,
  roles: readonly Role[],
): boolean {
  return roles.some((role) => identity.roles.includes(role));
}

/** True when the identity holds every one of the given roles. */
export function hasAllRoles(
  identity: IdentityContext,
  roles: readonly Role[],
): boolean {
  return roles.every((role) => identity.roles.includes(role));
}

/** True when the identity is internal staff (any staff role). */
export function isStaff(identity: IdentityContext): boolean {
  return identity.roles.some(isStaffRole);
}
