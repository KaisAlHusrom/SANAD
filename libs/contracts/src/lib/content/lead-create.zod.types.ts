import { z } from 'zod';
import { DEFAULT_LOCALE, localeSchema } from '../common/locale.js';
import { phoneSchema } from '../common/phone/index.js';
import { leadSourceSchema } from './lead-source.zod.types.js';

/**
 * The public contact / request-a-project submission (POST /api/leads, UNAUTHENTICATED).
 * Fields mirror `content-defaults.md` contact form (name/email/company/budget/type/message).
 * `source` distinguishes the two forms; `locale` records the site language for the reply.
 * Strict (N7) so unknown keys are rejected; runtime-validated → `.zod.types` (U16).
 *
 * `phone` is REQUIRED (P8.10.B1) and stored normalized as E.164 — a Gulf agency loses most
 * inbound without a callable number.
 */
export const leadCreateRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    phone: phoneSchema,
    company: z.string().trim().max(200).optional(),
    budget: z.string().trim().max(100).optional(),
    projectType: z.string().trim().max(100).optional(),
    message: z.string().trim().min(1).max(5000),
    source: leadSourceSchema.default('contact'),
    locale: localeSchema.default(DEFAULT_LOCALE),
  })
  .strict();

export type LeadCreateRequest = z.infer<typeof leadCreateRequestSchema>;
