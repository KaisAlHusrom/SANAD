import { describe, expect, it, vi } from 'vitest';
import {
  IdempotentConsumer,
  InMemoryProcessedStore,
} from './idempotent-consumer.js';

describe('IdempotentConsumer', () => {
  it('runs the handler once and skips redeliveries', async () => {
    const consumer = new IdempotentConsumer(new InMemoryProcessedStore());
    const handler = vi.fn(() => Promise.resolve());

    const first = await consumer.process('msg-1', handler);
    const second = await consumer.process('msg-1', handler);

    expect(first).toBe(true);
    expect(second).toBe(false);
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('processes distinct messages independently', async () => {
    const consumer = new IdempotentConsumer(new InMemoryProcessedStore());
    const handler = vi.fn(() => Promise.resolve());

    await consumer.process('a', handler);
    await consumer.process('b', handler);

    expect(handler).toHaveBeenCalledTimes(2);
  });
});
