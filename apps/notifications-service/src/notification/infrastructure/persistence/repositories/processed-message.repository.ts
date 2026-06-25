import { Injectable } from '@nestjs/common';
import type { DbExecutor } from '../../../../db/executor.js';
import { processedMessageTable } from '../../../../db/schema/index.js';

/**
 * The idempotency ledger (MS6). `claim` inserts the `(consumerId, messageId)` row inside the
 * caller's transaction and returns whether it was newly claimed — a duplicate delivery's
 * insert conflicts (returns false) so the consumer skips the side effect, all in ONE tx.
 * Stateless: every write runs on the caller's executor (the consumer's tx).
 */
@Injectable()
export class ProcessedMessageRepository {
  /** True if this message is newly claimed for the consumer; false if already processed. */
  async claim(
    exec: DbExecutor,
    consumerId: string,
    messageId: string,
  ): Promise<boolean> {
    const inserted = await exec
      .insert(processedMessageTable)
      .values({ consumerId, messageId })
      .onConflictDoNothing()
      .returning();
    return inserted.length > 0;
  }
}
