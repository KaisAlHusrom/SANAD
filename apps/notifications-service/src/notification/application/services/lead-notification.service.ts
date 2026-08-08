import { Inject, Injectable, Logger } from '@nestjs/common';
import { TransactionRunner } from '@sanad/database';
import type {
  LeadCreatedEvent,
  LeadNotificationPayload,
} from '@sanad/contracts';
import { NOTIFICATIONS_ENV, type NotificationsEnv } from '../../../env.js';
import type {
  NotificationInsert,
  NotificationRow,
} from '../../../db/schema/index.js';
import {
  EmailProvider,
  teamAlertEmail,
  visitorAckEmail,
} from '../../infrastructure/email/index.js';
import {
  NotificationRepository,
  ProcessedMessageRepository,
} from '../../infrastructure/persistence/repositories/index.js';

/** This consumer's stable id in the idempotency ledger (MS6). */
const CONSUMER_ID = 'notifications.lead-created';
/** The role audience that sees new-lead in-app notices (the team). */
const TEAM_ROLE = 'admin';

/**
 * Turns a `lead.created` event into notifications — exactly once even on redelivery (P6
 * acceptance). The idempotency claim + the notification-row inserts run in ONE transaction
 * via the injected `TransactionRunner` (N14 — this service never touches `DRIZZLE`): a
 * duplicate delivery's claim conflicts → the work returns null → no rows, no emails. Emails
 * are dispatched AFTER the tx commits (you can't hold a DB tx across an SMTP call); the rows
 * are the durable record (`email_status`), so a future sweeper can retry failures (MS6/MS7).
 */
@Injectable()
export class LeadNotificationService {
  private readonly logger = new Logger(LeadNotificationService.name);

  constructor(
    private readonly tx: TransactionRunner,
    private readonly processed: ProcessedMessageRepository,
    private readonly notifications: NotificationRepository,
    private readonly email: EmailProvider,
    @Inject(NOTIFICATIONS_ENV) private readonly env: NotificationsEnv,
  ) {}

  async handleLeadCreated(event: LeadCreatedEvent): Promise<void> {
    const payload: LeadNotificationPayload = {
      leadId: event.id,
      name: event.name,
      email: event.email,
      company: event.company,
      projectType: event.projectType,
      message: event.message,
      source: event.source,
      locale: event.locale,
    };

    const rows = await this.tx.run(async (txExec) => {
      const claimed = await this.processed.claim(txExec, CONSUMER_ID, event.id);
      if (!claimed) {
        return null; // duplicate delivery — already notified (MS6)
      }
      return this.notifications.insertMany(txExec, this.buildNotices(payload));
    });

    if (rows === null) {
      this.logger.log(
        `Duplicate lead.created ${event.id} — skipped (idempotent, MS6)`,
      );
      return;
    }

    await this.dispatchEmails(rows, payload);
  }

  /** The three notices a new lead fans out to (team in-app + team email + visitor ack). */
  private buildNotices(payload: LeadNotificationPayload): NotificationInsert[] {
    return [
      {
        recipientKind: 'role',
        recipient: TEAM_ROLE,
        channel: 'in_app',
        type: 'lead.created',
        payload,
        emailStatus: null,
      },
      {
        recipientKind: 'email',
        recipient: this.env.NOTIFICATIONS_TEAM_EMAIL,
        channel: 'email',
        type: 'lead.created',
        payload,
        emailStatus: 'pending',
      },
      {
        recipientKind: 'email',
        recipient: payload.email,
        channel: 'email',
        type: 'lead.received.ack',
        payload,
        emailStatus: 'pending',
      },
    ];
  }

  /** Send each pending email-channel row after commit, stamping sent/failed (MS6/MS7). */
  private async dispatchEmails(
    rows: NotificationRow[],
    payload: LeadNotificationPayload,
  ): Promise<void> {
    for (const row of rows.filter((r) => r.channel === 'email')) {
      // The visitor's acknowledgement follows the LEAD's locale; the team's alert follows the
      // TEAM's (`NOTIFICATIONS_TEAM_LOCALE`, ar by default) — two different readers (U24d).
      const body =
        row.type === 'lead.received.ack'
          ? visitorAckEmail(payload)
          : teamAlertEmail(payload, this.env.NOTIFICATIONS_TEAM_LOCALE);
      try {
        await this.email.send({ to: row.recipient, ...body });
        await this.notifications.markEmailSent(row.id);
      } catch (error) {
        this.logger.error(
          `Email ${row.type} to ${row.recipient} failed: ${String(error)}`,
        );
        await this.notifications.markEmailFailed(row.id);
      }
    }
  }
}
