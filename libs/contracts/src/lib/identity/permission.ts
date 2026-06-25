/**
 * Permission keys follow `<resource>.<action>` (e.g. `identity.users.read`).
 * Authorization is enforced at the gateway against the access token's `permissions`
 * claim. The wildcard semantics (global `manage` + per-resource `<resource>.manage`)
 * and the matching logic live in `./rbac.ts` `hasPermission` (the policy, U3);
 * this file owns only the identity domain's permission catalog.
 */

/** Build a `<resource>.<action>` permission key. */
export function permissionKey(resource: string, action: string): string {
  return `${resource}.${action}`;
}

/** Permission catalog owned by the identity domain (seeded by the identity service). */
export const IDENTITY_PERMISSIONS = {
  usersRead: 'identity.users.read',
  usersManage: 'identity.users.manage',
  rolesRead: 'identity.roles.read',
  rolesManage: 'identity.roles.manage',
} as const;
