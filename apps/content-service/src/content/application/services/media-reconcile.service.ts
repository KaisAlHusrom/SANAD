import { Inject, Injectable, Logger } from '@nestjs/common';
import { eq } from 'drizzle-orm';
// eslint-disable-next-line no-restricted-imports -- TODO(N14): grandfathered pre-rule; refactor to a TransactionRunner port (db belongs only in repositories).
import { DRIZZLE } from '@sanad/database';
import type { MediaDeletedEvent } from '@sanad/contracts';
import {
  blockTable,
  blogPostTable,
  portfolioProjectTable,
  serviceTable,
  teamMemberTable,
  testimonialTable,
  type ContentDb,
} from '../../../db/schema/index.js';
import { ProcessedMessageRepository } from '../../infrastructure/persistence/repositories/processed-message.repository.js';

/** This consumer's stable id in the idempotency ledger (MS6). */
const CONSUMER_ID = 'content.media-deleted';

/**
 * Reconciles content references when a media asset is deleted (the first `media.deleted`
 * consumer — MS6). Nulls every soft media reference (`imageMediaId`/`coverMediaId`) to the
 * deleted asset, idempotently: the claim + the UPDATEs run in ONE transaction, so a
 * redelivered event is a no-op (the claim conflicts → skip). The event's asset `id` is the
 * idempotency key (a `media.deleted` for an asset is logically once; the relay transmits
 * only the payload, not the outbox record id).
 */
@Injectable()
export class MediaReconcileService {
  private readonly logger = new Logger(MediaReconcileService.name);

  constructor(
    private readonly processed: ProcessedMessageRepository,
    @Inject(DRIZZLE) private readonly db: ContentDb,
  ) {}

  async reconcile(event: MediaDeletedEvent): Promise<void> {
    await this.db.transaction(async (tx) => {
      const claimed = await this.processed.claim(tx, CONSUMER_ID, event.id);
      if (!claimed) {
        return; // duplicate delivery — already reconciled (MS6)
      }
      await tx
        .update(blockTable)
        .set({ imageMediaId: null })
        .where(eq(blockTable.imageMediaId, event.id));
      await tx
        .update(serviceTable)
        .set({ coverMediaId: null })
        .where(eq(serviceTable.coverMediaId, event.id));
      await tx
        .update(testimonialTable)
        .set({ avatarMediaId: null })
        .where(eq(testimonialTable.avatarMediaId, event.id));
      await tx
        .update(teamMemberTable)
        .set({ avatarMediaId: null })
        .where(eq(teamMemberTable.avatarMediaId, event.id));
      await tx
        .update(portfolioProjectTable)
        .set({ coverMediaId: null })
        .where(eq(portfolioProjectTable.coverMediaId, event.id));
      await tx
        .update(blogPostTable)
        .set({ coverMediaId: null })
        .where(eq(blogPostTable.coverMediaId, event.id));
    });
    this.logger.log(
      `Reconciled content references to deleted media asset ${event.id}`,
    );
  }
}
