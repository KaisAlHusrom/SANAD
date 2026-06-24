import { Controller, Logger } from '@nestjs/common';
import { Ctx, EventPattern, Payload, RmqContext } from '@nestjs/microservices';
import { MEDIA_DELETED_EVENT, mediaDeletedEventSchema } from '@sanad/contracts';
import { MediaReconcileService } from '../../application/services/media-reconcile.service.js';

/** The minimal amqplib channel surface we use for manual ack (MS6) — avoids `any` (U4). */
interface RmqChannel {
  ack(message: unknown): void;
  nack(message: unknown, allUpTo: boolean, requeue: boolean): void;
}

/**
 * Consumes `media.deleted` from the media events queue (MS6 — the first cross-service
 * consumer). Manual ack: validate the payload, reconcile idempotently, then ack. A poison
 * (invalid) message is dead-lettered without requeue; a transient failure is also dropped
 * rather than infinitely requeued (the rule forbids infinite requeue — a proper DLQ + retry
 * counter is a `@sanad/messaging` enhancement). Reconcile is non-critical (it nulls stale
 * references), and the idempotency ledger makes redelivery safe.
 */
@Controller()
export class MediaDeletedConsumer {
  private readonly logger = new Logger(MediaDeletedConsumer.name);

  constructor(private readonly reconcile: MediaReconcileService) {}

  @EventPattern(MEDIA_DELETED_EVENT)
  async handle(
    @Payload() payload: unknown,
    @Ctx() context: RmqContext,
  ): Promise<void> {
    const channel = context.getChannelRef() as RmqChannel;
    const original: unknown = context.getMessage();

    const parsed = mediaDeletedEventSchema.safeParse(payload);
    if (!parsed.success) {
      this.logger.error(
        `Dropping invalid media.deleted payload: ${parsed.error.message}`,
      );
      channel.nack(original, false, false);
      return;
    }

    try {
      await this.reconcile.reconcile(parsed.data);
      channel.ack(original);
    } catch (error) {
      this.logger.error(
        `media.deleted reconcile failed for asset ${parsed.data.id} (dropped, no requeue): ${String(error)}`,
      );
      channel.nack(original, false, false);
    }
  }
}
