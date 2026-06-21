/**
 * Records which message ids have already been handled. The real implementation
 * persists ids in the same transaction as the business update (MS6); this
 * interface lets consumers stay storage-agnostic.
 */
export interface ProcessedStore {
  has(messageId: string): Promise<boolean>;
  add(messageId: string): Promise<void>;
}

/** A simple in-memory ProcessedStore — for tests and local development only. */
export class InMemoryProcessedStore implements ProcessedStore {
  private readonly seen = new Set<string>();

  has(messageId: string): Promise<boolean> {
    return Promise.resolve(this.seen.has(messageId));
  }

  add(messageId: string): Promise<void> {
    this.seen.add(messageId);
    return Promise.resolve();
  }
}

/**
 * Wraps a handler so a redelivered message runs its side effect exactly once
 * (MS6). Returns `true` if the handler ran, `false` if the message was a
 * duplicate and was skipped.
 */
export class IdempotentConsumer {
  constructor(private readonly store: ProcessedStore) {}

  async process(
    messageId: string,
    handler: () => Promise<void>,
  ): Promise<boolean> {
    if (await this.store.has(messageId)) {
      return false;
    }
    await handler();
    await this.store.add(messageId);
    return true;
  }
}
