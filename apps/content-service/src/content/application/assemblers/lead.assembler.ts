import type { Lead, Locale } from '@sanad/contracts';
import type { LeadRow } from '../../../db/schema/index.js';

/** Narrow the DB `locale` text column to a `Locale` (defaults to ar — the platform default). */
function toLocale(value: string): Locale {
  return value === 'en' ? 'en' : 'ar';
}

/** Assemble a lead for the admin inbox (the public submit returns only `{ id }`). */
export function assembleLead(row: LeadRow): Lead {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    phone: row.phone,
    company: row.company,
    budget: row.budget,
    projectType: row.projectType,
    message: row.message,
    source: row.source,
    locale: toLocale(row.locale),
    status: row.status,
    submissionCount: row.submissionCount,
    lastSubmittedAt: row.lastSubmittedAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
