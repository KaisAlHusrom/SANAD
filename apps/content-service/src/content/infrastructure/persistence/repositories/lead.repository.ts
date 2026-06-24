import { Inject, Injectable } from '@nestjs/common';
import {
  BaseRepository,
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type {
  Locale,
  LeadListQuery,
  LeadSource,
  Paginated,
} from '@sanad/contracts';
import type { DbExecutor } from '../../../../db/executor.js';
import {
  leadTable,
  type ContentDb,
  type LeadRow,
} from '../../../../db/schema/index.js';
import { leadModelConfig } from '../model-configs/lead.model-config.js';

/** A new lead to persist (the public submission, before the Outbox event). */
export interface LeadInsertInput {
  name: string;
  email: string;
  company: string | null;
  budget: string | null;
  projectType: string | null;
  message: string;
  source: LeadSource;
  locale: Locale;
}

/**
 * Whitelisted lead-inbox filters (N7): free-text over name/email/company + exact status +
 * source. Never raw column passthrough.
 */
const LEAD_FILTERS: FilterSpec = {
  search: { kind: 'search', columns: ['name', 'email', 'company'] },
  status: { kind: 'column', field: 'status', op: 'eq' },
  source: { kind: 'column', field: 'source', op: 'eq' },
};

/**
 * Lead persistence (N1) on the enhanced base. Owns the admin inbox list + status update;
 * the public submit inserts on the caller's executor so it composes inside the Outbox
 * transaction (MS3).
 */
@Injectable()
export class LeadRepository extends BaseRepository<typeof leadTable, LeadRow> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, leadModelConfig);
  }

  /** A paginated, searchable, status/source-filterable list of live leads. */
  list(query: LeadListQuery): Promise<Paginated<LeadRow>> {
    return this.paginateFiltered(
      { search: query.search, status: query.status, source: query.source },
      LEAD_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }

  /** Insert a lead on the caller's executor (composes inside the `lead.created` tx, MS3). */
  async insert(exec: DbExecutor, input: LeadInsertInput): Promise<LeadRow> {
    const rows = await exec
      .insert(leadTable)
      .values({
        name: input.name,
        email: input.email,
        company: input.company,
        budget: input.budget,
        projectType: input.projectType,
        message: input.message,
        source: input.source,
        locale: input.locale,
      })
      .returning();
    const row = rows[0];
    if (!row) {
      throw new Error('lead insert returned no row');
    }
    return row;
  }
}
