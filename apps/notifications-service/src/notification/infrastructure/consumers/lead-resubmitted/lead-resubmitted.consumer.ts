import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import {
  LEAD_RESUBMITTED_EVENT,
  leadResubmittedEventSchema,
} from '@sanad/contracts';
import { LeadNotificationService } from '../../../application/services/index.js';

/** The minimal amqplib channel surface we use for manual ack (MS6) — avoids `any` (U4). */
interface RmqChannel {
  ack(message: unknown): void;
  nack(message: unknown, allUpTo: boolean, requeue: boolean): void;
}

/**
 * Consumes `lead.resubmitted` from the content events queue (P8.10.B2) — the same queue
 * `lead.created` arrives on, so `main.ts` binds nothing new. Identical delivery policy to its
 * sibling: validate, notify idempotently, ack; a poison or transiently-failing message is
 * dead-lettered without requeue (MS6 forbids infinite requeue), and the idempotency ledger
 * makes any redelivery safe.
 */
@Controller()
export class LeadResubmittedConsumer {
  private readonly logger = new Logger(LeadResubmittedConsumer.name);

  constructor(private readonly leadNotifications: LeadNotificationService) {}

  @EventPattern(LEAD_RESUBMITTED_EVENT)
  async handle(
    @Payload() payload: unknown,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RmqChannel;
    const original: unknown = context.getMessage();

    const parsed = leadResubmittedEventSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.error(
        `Dropping invalid lead.resubmitted payload: ${parsed.error.message}`,
      );
      channel.nack(original, false, false);
      return;
    }

    try {
      await this.leadNotifications.handleLeadResubmitted(parsed.data);
      channel.ack(original);
    } catch (error) {
      this.logger.error(
        `lead.resubmitted notify failed for lead ${parsed.data.id} (dropped, no requeue): ${String(error)}`,
      );
      channel.nack(original, false, false);
    }
  }
}
