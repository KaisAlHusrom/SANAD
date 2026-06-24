/**
 * Permission catalog owned by the settings domain (seeded by the identity service's
 * RBAC catalog; enforced at the gateway against the token's `permissions` claim).
 * `<resource>.<action>`; wildcard semantics (global `manage` + `settings.manage`)
 * live in `@sanad/auth` `hasPermission` (U3). Reading branding is PUBLIC (the website
 * needs it unauthenticated), so only a manage permission is defined here.
 */
export const SETTINGS_PERMISSIONS = {
  read: 'settings.read',
  manage: 'settings.manage',
} as const;
