/**
 * Permission catalog owned by the notifications domain (seeded by the identity RBAC
 * catalog; enforced at the gateway against the token's `permissions` claim). `read` gates
 * viewing/marking one's own in-app notifications; `manage` is reserved for future admin
 * send/broadcast. `<resource>.<action>`; the global `manage` wildcard covers both (U3).
 */
export const NOTIFICATION_PERMISSIONS = {
  read: 'notification.read',
  manage: 'notification.manage',
} as const;
