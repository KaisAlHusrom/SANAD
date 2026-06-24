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

/**
 * The global superadmin permission: holding it grants every action everywhere.
 * Keeps admin tokens tiny (one claim instead of the whole catalog).
 */
export const GLOBAL_MANAGE_PERMISSION = 'manage';

/** The wildcard action that grants every action on its resource. */
export const MANAGE_ACTION = 'manage';

/**
 * Decide whether a set of granted permission keys satisfies a required
 * `<resource>.<action>` key. Honors two wildcards (decision: permissions-in-token):
 *  - the global `manage` permission grants everything;
 *  - a `<resource>.manage` permission grants every action on that resource
 *    (the required key with its last segment swapped for `manage`).
 * Fail-closed: unknown/empty grants deny.
 */
export function hasPermission(
  granted: readonly string[],
  required: string,
): boolean {
  if (granted.includes(GLOBAL_MANAGE_PERMISSION)) {
    return true;
  }
  if (granted.includes(required)) {
    return true;
  }
  const lastDot = required.lastIndexOf('.');
  if (lastDot > 0) {
    const resourceWildcard = `${required.slice(0, lastDot)}.${MANAGE_ACTION}`;
    if (granted.includes(resourceWildcard)) {
      return true;
    }
  }
  return false;
}

/** True when the identity's resolved permissions satisfy the required key. */
export function identityHasPermission(
  identity: IdentityContext,
  required: string,
): boolean {
  return hasPermission(identity.permissions, required);
}
