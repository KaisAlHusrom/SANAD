import { z } from 'zod';

/**
 * Delivery state of an email-channel notification (the row is the durable record of intent,
 * N13/MS6). `pending` until dispatched after the consumer's tx commits, then `sent` or
 * `failed`. In-app notices have no email status (null). A future sweeper can re-send rows
 * stuck `pending`/`failed` idempotently.
 */
export const emailStatusSchema = z.enum(['pending', 'sent', 'failed']);
export type EmailStatus = z.infer<typeof emailStatusSchema>;
