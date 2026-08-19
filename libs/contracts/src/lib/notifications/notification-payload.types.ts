import type { Locale } from '../common/locale.js';
import type { LeadSource } from '../content/lead-source.zod.types.js';

/**
 * The structured payload stored on a lead notification (jsonb) — the lead summary the
 * portal renders ("new lead from {name}") and the email templates fill in. Non-translatable
 * captured data; `locale` records which site language the visitor used (drives the ack
 * email language). Pure shape (U16).
 */
export interface LeadNotificationPayload {
  leadId: string;
  name: string;
  email: string;
  /** E.164, or null for a lead captured before P8.10.B1. */
  phone: string | null;
  company: string | null;
  projectType: string | null;
  message: string;
  source: LeadSource;
  locale: Locale;
}

/**
 * The union of notification payload shapes. P6 has a single member (lead); it becomes a
 * discriminated union (keyed by `NotificationType`) as more event consumers land.
 */
export type NotificationPayload = LeadNotificationPayload;
