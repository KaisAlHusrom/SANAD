import { Inject, Injectable } from '@nestjs/common';
import { and, desc, eq, gte, isNull, ne, or, sql } from 'drizzle-orm';
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

/** Who is submitting, as the duplicate lookup identifies them. */
export interface LeadIdentity {
  email: string;
  phone: string | null;
}

/** A new lead to persist (the public submission, before the Outbox event). */
export interface LeadInsertInput {
  name: string;
  email: string;
  phone: string | null;
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
  search: { kind: 'search', columns: ['name', 'email', 'phone', 'company'] },
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

  /**
   * Serialize this transaction against every OTHER submission that could match it (P8.10.B2).
   *
   * `for update` on the candidate row is not enough on its own: two submissions racing for a
   * person who has NO lead yet both find nothing to lock, and both insert. An advisory lock has
   * no such gap — it exists whether or not a row does, and Postgres releases it at commit or
   * rollback with no cleanup path to forget.
   *
   * It must cover **both** identifiers, because the match below is `email OR phone`: locking the
   * email alone leaves two first-submissions that share a phone but differ by email taking
   * different locks and both inserting. Keys are acquired in ascending order so two transactions
   * holding the same pair can never take them in opposite sequences and deadlock.
   */
  async lockIdentity(exec: DbExecutor, identity: LeadIdentity): Promise<void> {
    // `hashtext` is Postgres', so the keys are computed there and ordered here.
    const hashed = await exec
      .select({
        email: sql<number>`hashtext(lower(${identity.email}))`,
        phone: identity.phone
          ? sql<number>`hashtext(${identity.phone})`
          : sql<number | null>`null::int4`,
      })
      .from(sql`(select 1) as _keys`);
    const row = hashed[0];
    if (!row) {
      throw new Error('lead identity hash returned no row');
    }
    const keys = [...new Set([row.email, row.phone])]
      .filter((key): key is number => key !== null)
      .sort((a, b) => a - b);

    for (const key of keys) {
      await exec
        .select({ locked: sql<boolean>`pg_advisory_xact_lock(${key}) is null` })
        .from(sql`(select 1) as _lock`);
    }
  }

  /**
   * The live lead this submission should fold into, locked for the caller's transaction — or
   * null if this is genuinely new (P8.10.B2).
   *
   * `for update` is the whole point: two submissions racing from the same person must not both
   * find nothing and both insert. The second transaction blocks on the row until the first
   * commits, then sees the bumped counter (U30a — prove the precondition INSIDE the transaction,
   * not moments before it).
   *
   * Matching is deliberate on every clause: EITHER identifier (one person, two forms), email
   * case-insensitively, an archived lead excluded (the team closed that thread — writing again
   * is new inbound), and the window measured from the LAST submission so a persistent repeater
   * keeps folding instead of spawning a row once the original ages out.
   */
  async findActiveDuplicateForUpdate(
    exec: DbExecutor,
    identity: LeadIdentity,
    since: Date,
  ): Promise<LeadRow | null> {
    const matchesIdentity = identity.phone
      ? or(
          sql`lower(${leadTable.email}) = lower(${identity.email})`,
          eq(leadTable.phone, identity.phone),
        )
      : sql`lower(${leadTable.email}) = lower(${identity.email})`;

    const rows = await exec
      .select()
      .from(leadTable)
      .where(
        and(
          isNull(leadTable.deletedAt),
          ne(leadTable.status, 'archived'),
          gte(leadTable.lastSubmittedAt, since),
          matchesIdentity,
        ),
      )
      .orderBy(desc(leadTable.lastSubmittedAt))
      .limit(1)
      .for('update');
    return rows[0] ?? null;
  }

  /** Fold a repeat into an existing lead: bump the counter, move the clock (P8.10.B2). */
  async recordResubmission(
    exec: DbExecutor,
    id: string,
    at: Date,
  ): Promise<LeadRow> {
    const rows = await exec
      .update(leadTable)
      .set({
        submissionCount: sql`${leadTable.submissionCount} + 1`,
        lastSubmittedAt: at,
        updatedAt: at,
      })
      .where(eq(leadTable.id, id))
      .returning();
    const row = rows[0];
    if (!row) {
      throw new Error('lead resubmission update returned no row');
    }
    return row;
  }

  /** Insert a lead on the caller's executor (composes inside the `lead.created` tx, MS3). */
  async insert(exec: DbExecutor, input: LeadInsertInput): Promise<LeadRow> {
    const rows = await exec
      .insert(leadTable)
      .values({
        name: input.name,
        email: input.email,
        phone: input.phone,
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
