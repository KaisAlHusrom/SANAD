import type { Locale } from '../common/locale.js';
import type { LeadSource } from './lead-source.zod.types.js';
import type { LeadSpamSignal } from './lead-spam-signal.zod.types.js';
import type { LeadStatus } from './lead-status.zod.types.js';

/**
 * A captured lead as the admin inbox sees it (P7). Not translatable — it's user-submitted
 * data; `locale` records which site language the visitor used (for the reply). Pure response
 * shape (U16). The public submit endpoint returns only `{ id }` ({@link LeadId}).
 */
export interface Lead {
  id: string;
  name: string;
  email: string;
  /** E.164. Nullable only because leads captured before P8.10.B1 have none. */
  phone: string | null;
  company: string | null;
  budget: string | null;
  projectType: string | null;
  message: string;
  source: LeadSource;
  locale: Locale;
  status: LeadStatus;
  /** How many times this person has submitted — 1 unless a repeat was folded in (P8.10.B2). */
  submissionCount: number;
  /** When they last submitted. Equals `createdAt` until a repeat is folded in. */
  lastSubmittedAt: string;
  /**
   * 0..100 (P8.10.B3). Advisory — it ranks the inbox, it never rejected the submission. Leads
   * captured before B3 read 0, which every surface treats exactly like a genuinely clean one.
   */
  spamScore: number;
  /** Why it scored — the fired signals with their weights. Empty when nothing fired. */
  spamSignals: LeadSpamSignal[];
  createdAt: string;
  updatedAt: string;
}

/** The public submit reply — just the new lead's id (never echo the row back to the website). */
export interface LeadId {
  id: string;
}
