import { z } from 'zod';

/**
 * The kind of notification, driving its template + how the UI renders it. For P6: a new
 * contact-form lead alerts the team (`lead.created` — both the in-app notice and the team
 * email) and acknowledges the visitor (`lead.received.ack` — the localized email back to
 * the person who submitted). `lead.resubmitted` (P8.10.B2) is the team-only follow-up when a
 * submission folded into an existing lead instead of creating one — the visitor is NOT
 * acknowledged twice. New event consumers add types here.
 */
export const notificationTypeSchema = z.enum([
  'lead.created',
  'lead.received.ack',
  'lead.resubmitted',
]);
export type NotificationType = z.infer<typeof notificationTypeSchema>;
