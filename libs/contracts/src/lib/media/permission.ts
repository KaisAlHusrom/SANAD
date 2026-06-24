/**
 * Media RBAC permission keys (`<resource>.<action>`). Checked at the gateway edge
 * (MS4); the admin `manage` wildcard covers both. Seeded into the identity catalog
 * so they're assignable to staff roles.
 */
export const MEDIA_PERMISSIONS = {
  read: 'media.read',
  manage: 'media.manage',
} as const;
