import { z } from 'zod';

/**
 * What `recipient` points at — a `role` audience (e.g. a team broadcast staff see in the
 * portal), a specific `user` (their id), or an external `email` address (team alert /
 * visitor acknowledgement). The in-app read endpoint matches `role` against the caller's
 * forwarded roles and `user` against their id (MS4) — never joining the identity service.
 */
export const notificationRecipientKindSchema = z.enum([
  'role',
  'user',
  'email',
]);
export type NotificationRecipientKind = z.infer<
  typeof notificationRecipientKindSchema
>;
