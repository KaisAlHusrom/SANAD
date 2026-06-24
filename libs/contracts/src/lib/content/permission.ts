/**
 * Content RBAC permission keys (`<resource>.<action>`). Checked at the gateway edge
 * (MS4); the admin `manage` wildcard covers both. Seeded into the identity catalog so
 * they're assignable to staff roles (e.g. a blog writer gets `content.manage`). Website
 * reads are PUBLIC (unauthenticated) — these gate only the admin CMS surface + leads inbox.
 */
export const CONTENT_PERMISSIONS = {
  read: 'content.read',
  manage: 'content.manage',
} as const;
