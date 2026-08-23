import { z } from 'zod';
import { localeSchema } from '../common/locale.js';
import { leadSourceSchema } from './lead-source.zod.types.js';

/**
 * The `lead.resubmitted` event payload (MS3 Outbox, P8.10.B2). Emitted when a submission was
 * folded into an existing lead rather than creating a second one.
 *
 * It carries the visitor's **new** message, not the original: that text is the entire reason the
 * event exists. Without it the second thing a person says lives only in `audit_log`, which has no
 * admin surface — so the team would see a counter tick and never learn what changed.
 *
 * Zod-first (U16) so the consumer runtime-validates the inbound broker message. `occurredAt` is an
 * ISO string from the producer's `DateTimeService` (N3).
 */
export const leadResubmittedEventSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().min(1),
    email: z.string().email(),
    phone: z.string().nullable(),
    /** What the visitor wrote THIS time. */
    message: z.string().min(1),
    /** Which form they came back through — it may differ from the original lead's. */
    source: leadSourceSchema,
    locale: localeSchema,
    /** How many times in total, including this one — 2 on the first fold. */
    submissionCount: z.number().int().positive(),
    occurredAt: z.string().min(1),
  })
  .strict();

export type LeadResubmittedEvent = z.infer<typeof leadResubmittedEventSchema>;
