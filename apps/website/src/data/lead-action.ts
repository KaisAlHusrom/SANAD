'use server';

import {
  leadCreateRequestSchema,
  type LeadCreateRequest,
} from '@sanad/contracts';
import { createLead } from './leads';

/**
 * Server action for the public contact / request-a-project form. Runs server-side (WEB2)
 * so the client never sees the in-cluster gateway URL; re-validates with the strict schema
 * (N7) before forwarding to `POST /api/leads`. The client `LeadForm` imports this and calls
 * it on submit.
 */
export async function submitLeadAction(
  values: LeadCreateRequest,
): Promise<void> {
  const parsed = leadCreateRequestSchema.parse(values);
  await createLead(parsed);
}
