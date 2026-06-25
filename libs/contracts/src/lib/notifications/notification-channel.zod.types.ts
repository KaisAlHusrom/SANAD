import { z } from 'zod';

/** A notification's delivery channel: an in-app notice (the portal bell) or an email. */
export const notificationChannelSchema = z.enum(['in_app', 'email']);
export type NotificationChannel = z.infer<typeof notificationChannelSchema>;
