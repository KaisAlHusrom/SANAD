import type { NotificationChannel } from './notification-channel.zod.types.js';
import type { NotificationType } from './notification-type.zod.types.js';
import type { NotificationPayload } from './notification-payload.types.js';

/**
 * An in-app notification as the portal bell sees it (P7). The read endpoint returns only
 * `in_app`-channel rows scoped to the caller (their roles ∪ their id). `readAt` is null
 * until the user marks it read. Pure response shape (U16) — email-channel rows + recipient
 * targeting stay server-side.
 */
export interface Notification {
  id: string;
  channel: NotificationChannel;
  type: NotificationType;
  payload: NotificationPayload;
  readAt: string | null;
  createdAt: string;
}
