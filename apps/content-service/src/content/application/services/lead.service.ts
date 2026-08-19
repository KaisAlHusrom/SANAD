import { Inject, Injectable } from '@nestjs/common';
// eslint-disable-next-line no-restricted-imports -- TODO(N14): grandfathered pre-rule; refactor to a TransactionRunner port (db belongs only in repositories).
import { DateTimeService, DRIZZLE } from '@sanad/database';
import { createOutboxRecord, DrizzleOutboxStore } from '@sanad/messaging';
import {
  LEAD_CREATED_EVENT,
  type Lead,
  type LeadCreatedEvent,
  type LeadCreateRequest,
  type LeadId,
  type LeadListQuery,
  type LeadUpdateRequest,
  type Locale,
  type Paginated,
} from '@sanad/contracts';
import type { ContentDb } from '../../../db/schema/index.js';
import { LeadRepository } from '../../infrastructure/persistence/repositories/lead.repository.js';
import { assembleLead } from '../assemblers/lead.assembler.js';
import { contentNotFound } from '../errors/content-errors.js';

function toLocale(value: string): Locale {
  return value === 'en' ? 'en' : 'ar';
}

/**
 * Leads — the website contact / request-a-project capture. `submit` persists the lead AND
 * enqueues `lead.created` in ONE transaction (MS3, the canonical Outbox pattern); the relay
 * publishes it for notifications (P6). The admin inbox lists + transitions status.
 */
@Injectable()
export class LeadService {
  constructor(
    private readonly leads: LeadRepository,
    private readonly clock: DateTimeService,
    @Inject(DRIZZLE) private readonly db: ContentDb,
  ) {}

  /** Persist a lead + emit `lead.created` via the Outbox, atomically (MS3). Public. */
  async submit(req: LeadCreateRequest): Promise<LeadId> {
    const created = await this.db.transaction(async (tx) => {
      const row = await this.leads.insert(tx, {
        name: req.name,
        email: req.email,
        phone: req.phone,
        company: req.company ?? null,
        budget: req.budget ?? null,
        projectType: req.projectType ?? null,
        message: req.message,
        source: req.source,
        locale: req.locale,
      });
      const outbox = new DrizzleOutboxStore(tx, this.clock);
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
      await outbox.enqueue(
        createOutboxRecord(LEAD_CREATED_EVENT, event, this.clock.nowIso()),
      );
      return row;
    });
    return { id: created.id };
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
