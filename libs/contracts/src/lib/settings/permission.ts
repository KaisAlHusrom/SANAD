import type { IntegrationCapability } from './integration-catalog.js';

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
 * Integrations permissions (N13, the capability→providers rework). Viewing the masked
 * integrations page needs `settings.integrations.read`; each **capability** owns a manage key so
 * an operator can be granted exactly the integrations they administer (configuring a provider,
 * activating one, and testing all require it). Admin's global `manage` wildcard still covers all.
 */
export const INTEGRATION_PERMISSIONS = {
  read: 'settings.integrations.read',
} as const;

/** The manage permission a capability owns — `settings.integrations.<capability>.manage`. */
export function integrationManagePermission(
  capability: IntegrationCapability,
): string {
  return `settings.integrations.${capability}.manage`;
}
