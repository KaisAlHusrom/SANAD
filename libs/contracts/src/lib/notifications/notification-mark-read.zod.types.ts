import { z } from 'zod';

/**
 * Mark one in-app notification read (P7). The gateway folds the `:id` path param into this
 * RMQ payload; the service stamps `readAt` only if the notification belongs to the caller
 * (their roles ∪ id, MS4). Strict (N7).
 */
export const notificationMarkReadSchema = z
  .object({ id: z.string().uuid() })
  .strict();

export type NotificationMarkRead = z.infer<typeof notificationMarkReadSchema>;
