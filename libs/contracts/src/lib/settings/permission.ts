import type { SecretFeature } from './secret-key.zod.types.js';

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

/**
 * Integration-secret permissions (N13 — "gated per-integration"). The vault is NOT under
 * `settings.manage`: viewing the masked statuses needs `settings.secrets.read`, and each
 * third party owns a `settings.secrets.<feature>.manage` key so an operator can be granted
 * exactly the providers they administer. Admin's global `manage` wildcard still covers all.
 */
export const SECRET_PERMISSIONS = {
  read: 'settings.secrets.read',
} as const;

/** The manage permission a third party (by feature) owns — `settings.secrets.<feature>.manage`. */
export function secretManagePermission(feature: SecretFeature): string {
  return `settings.secrets.${feature}.manage`;
}
