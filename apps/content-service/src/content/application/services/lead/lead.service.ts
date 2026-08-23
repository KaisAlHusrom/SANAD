import { Injectable, Logger } from '@nestjs/common';
import { AuditRecorder } from '@sanad/audit';
import {
  DateTimeService,
  TransactionRunner,
  type RepoDb,
} from '@sanad/database';
import { createOutboxRecord, DrizzleOutboxStore } from '@sanad/messaging';
import {
  LEAD_CREATED_EVENT,
  LEAD_RESUBMITTED_EVENT,
  type Lead,
  type LeadCreatedEvent,
  type LeadCreateRequest,
  type LeadId,
  type LeadListQuery,
  type LeadResubmittedEvent,
  type LeadUpdateRequest,
  type Locale,
  type Paginated,
} from '@sanad/contracts';
import type { LeadRow } from '../../../../db/schema/index.js';
import { scoreLeadForSpam } from '../../../domain/scorers/lead-spam/index.js';
import { LeadRepository } from '../../../infrastructure/persistence/repositories/lead.repository.js';
import { assembleLead } from '../../assemblers/lead.assembler.js';
import { contentNotFound } from '../../errors/content-errors.js';
import { LeadDedupSettingsResolver } from '../../resolvers/lead-dedup-settings/index.js';

function toLocale(value: string): Locale {
  return value === 'en' ? 'en' : 'ar';
}

const AUDIT_ENTITY = 'lead';
const MILLIS_PER_SECOND = 1000;

/**
 * Leads — the website contact / request-a-project capture.
 *
 * `submit` is one transaction that does the whole thing (MS3 + U30a): decide whether this is a
 * new lead or a repeat, write the row or bump the counter, record the audit trail, and enqueue
 * the matching Outbox event. Everything shares the transaction on purpose — a rolled-back
 * submission must leave no audit row claiming it happened and no event announcing it.
 *
 * The duplicate decision is made INSIDE the transaction against a locked row, not before it, so
 * two simultaneous submissions from the same person cannot both conclude "this is new".
 */
@Injectable()
export class LeadService {
  private readonly logger = new Logger(LeadService.name);

  constructor(
    private readonly leads: LeadRepository,
    private readonly clock: DateTimeService,
    private readonly tx: TransactionRunner,
    private readonly audit: AuditRecorder,
    private readonly dedupSettings: LeadDedupSettingsResolver,
  ) {}

  /**
   * Persist a lead — or fold it into the one this person already has (P8.10.B2). Public.
   *
   * Returns the id either way: the website has nothing useful to do with the distinction, and
   * telling a visitor "you already contacted us" is both unhelpful and an enumeration oracle.
   */
  async submit(req: LeadCreateRequest): Promise<LeadId> {
    // Resolved OUTSIDE the transaction: it is an RMQ round trip, and holding a DB transaction
    // open across the network is how a slow broker becomes a lock-contention incident.
    const dedup = await this.dedupSettings.current();
    const since = new Date(
      this.clock.nowMillis() - dedup.windowSeconds * MILLIS_PER_SECOND,
    );

    return this.tx.run(async (txExec) => {
      if (dedup.enabled) {
        // BEFORE the lookup: `for update` cannot lock a row that does not exist yet, so two
        // simultaneous FIRST submissions would both find nothing and both insert. The advisory
        // lock exists whether or not a row does (U30a). It takes the SAME identity the match
        // below uses — one argument, so the lock keys and the predicate cannot drift apart.
        await this.leads.lockIdentity(txExec, {
          email: req.email,
          phone: req.phone,
        });
      }
      const existing = dedup.enabled
        ? await this.leads.findActiveDuplicateForUpdate(
            txExec,
            { email: req.email, phone: req.phone },
            since,
          )
        : null;

      return existing
        ? this.fold(txExec, existing, req)
        : this.create(txExec, req);
    });
  }

  /** A genuinely new lead: insert, audit, announce. */
  private async create(
    txExec: RepoDb,
    req: LeadCreateRequest,
  ): Promise<LeadId> {
    const spam = scoreLeadForSpam({
      name: req.name,
      company: req.company ?? null,
      message: req.message,
    });
    const row = await this.leads.insert(txExec, {
      name: req.name,
      email: req.email,
      phone: req.phone,
      company: req.company ?? null,
      budget: req.budget ?? null,
      projectType: req.projectType ?? null,
      message: req.message,
      source: req.source,
      locale: req.locale,
      spamScore: spam.score,
      spamSignals: spam.signals,
    });

    // Recorded explicitly rather than left to the interceptor's fallback: the fallback exists
    // for a handler that recorded nothing, and it writes a row with no `entityId`. A public
    // submission's trail — which ip, which user-agent, which request id — is the forensic
    // record an anti-abuse phase is FOR, so it gets a real row.
    await this.audit.recordWithin(txExec, {
      action: 'lead.submitted',
      entityType: AUDIT_ENTITY,
      entityId: row.id,
      after: {
        email: row.email,
        phone: row.phone,
        source: row.source,
        spamScore: row.spamScore,
      },
    });

    const event: LeadCreatedEvent = {
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      company: row.company,
      projectType: row.projectType,
      message: row.message,
      source: row.source,
      locale: toLocale(row.locale),
      occurredAt: this.clock.nowIso(),
    };
    await new DrizzleOutboxStore(txExec, this.clock).enqueue(
      createOutboxRecord(LEAD_CREATED_EVENT, event, event.occurredAt),
    );
    return { id: row.id };
  }

  /**
   * A repeat inside the window: bump the counter instead of creating a second row, record what
   * they wrote this time in the audit trail, and tell the team.
   */
  private async fold(
    txExec: RepoDb,
    existing: LeadRow,
    req: LeadCreateRequest,
  ): Promise<LeadId> {
    const at = this.clock.now().toJSDate();

    // The HIGHER of the two assessments wins, and carries its own signals. A folded thread is one
    // row, so it needs one verdict — and taking the max is the only choice that cannot lose a
    // signal: a clean opener followed by a blast must not launder the blast, and a spammy opener
    // followed by a real enquiry still only RANKS the lead (it is never dropped or archived).
    const rescored = scoreLeadForSpam({
      name: req.name,
      company: req.company ?? null,
      message: req.message,
    });
    const spam =
      rescored.score > existing.spamScore
        ? { spamScore: rescored.score, spamSignals: rescored.signals }
        : {
            spamScore: existing.spamScore,
            spamSignals: existing.spamSignals,
          };

    const updated = await this.leads.recordResubmission(
      txExec,
      existing.id,
      at,
      spam,
    );

    // The audit row is where the repeat's FULL payload survives — the lead row keeps the
    // original message so the team's reply thread stays coherent.
    await this.audit.recordWithin(txExec, {
      action: 'lead.resubmitted',
      entityType: AUDIT_ENTITY,
      entityId: existing.id,
      before: {
        submissionCount: existing.submissionCount,
        lastSubmittedAt: existing.lastSubmittedAt.toISOString(),
        spamScore: existing.spamScore,
      },
      after: {
        submissionCount: updated.submissionCount,
        lastSubmittedAt: updated.lastSubmittedAt.toISOString(),
        spamScore: updated.spamScore,
        message: req.message,
        source: req.source,
      },
    });

    const event: LeadResubmittedEvent = {
      id: updated.id,
      name: updated.name,
      email: updated.email,
      phone: updated.phone,
      // What they wrote THIS time — the reason the event exists.
      message: req.message,
      source: req.source,
      locale: req.locale,
      submissionCount: updated.submissionCount,
      occurredAt: this.clock.nowIso(),
    };
    await new DrizzleOutboxStore(txExec, this.clock).enqueue(
      createOutboxRecord(LEAD_RESUBMITTED_EVENT, event, event.occurredAt),
    );

    this.logger.log(
      `Lead ${updated.id} absorbed a repeat submission (#${String(updated.submissionCount)})`,
    );
    return { id: updated.id };
  }

  /** The admin leads inbox (P7), paginated/filterable. */
  async list(query: LeadListQuery): Promise<Paginated<Lead>> {
    const page = await this.leads.list(query);
    return { items: page.items.map(assembleLead), meta: page.meta };
  }

  /** Transition a lead's inbox status (admin). */
  async updateStatus(req: LeadUpdateRequest): Promise<Lead> {
    const existing = await this.leads.find(req.id);
    if (!existing) {
      throw contentNotFound('Lead', req.id);
    }
    const updated = await this.leads.update(req.id, { status: req.status });
    return assembleLead(updated);
  }
}
