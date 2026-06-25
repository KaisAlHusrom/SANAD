import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { LEAD_CREATED_EVENT, leadCreatedEventSchema } from '@sanad/contracts';
import { LeadNotificationService } from '../../application/services/index.js';

/** The minimal amqplib channel surface we use for manual ack (MS6) — avoids `any` (U4). */
interface RmqChannel {
  ack(message: unknown): void;
  nack(message: unknown, allUpTo: boolean, requeue: boolean): void;
}

/**
 * Consumes `lead.created` from the content events queue (MS6 — P6's reason to exist). Manual
 * ack: validate the payload, notify idempotently (the service's tx guarantees exactly-once),
 * then ack. A poison (invalid) message is dead-lettered without requeue; a transient failure
 * is also dropped rather than infinitely requeued (the rule forbids infinite requeue — a
 * proper DLQ + retry counter is a `@sanad/messaging` enhancement). The idempotency ledger
 * makes any redelivery safe.
 */
@Controller()
export class LeadCreatedConsumer {
  private readonly logger = new Logger(LeadCreatedConsumer.name);

  constructor(private readonly leadNotifications: LeadNotificationService) {}

  @EventPattern(LEAD_CREATED_EVENT)
  async handle(
    @Payload() payload: unknown,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RmqChannel;
    const original: unknown = context.getMessage();

    const parsed = leadCreatedEventSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.error(
        `Dropping invalid lead.created payload: ${parsed.error.message}`,
      );
      channel.nack(original, false, false);
      return;
    }

    try {
      await this.leadNotifications.handleLeadCreated(parsed.data);
      channel.ack(original);
    } catch (error) {
      this.logger.error(
        `lead.created notify failed for lead ${parsed.data.id} (dropped, no requeue): ${String(error)}`,
      );
      channel.nack(original, false, false);
    }
  }
}
