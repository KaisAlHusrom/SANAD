import { describe, expect, it, vi } from 'vitest';
import type { OutboxRecord, OutboxStore } from '../../outbox.js';
import { OutboxRelay, type OutboxPublisher } from './outbox-relay.js';

function record(id: string): OutboxRecord {
  return {
    id,
    eventName: 'user.registered',
    payload: '{"userId":"u"}',
    occurredAt: '2026-06-22T10:00:00.000Z',
    publishedAt: null,
  };
}

function fakeStore(
  initial: OutboxRecord[],
): OutboxStore & { published: string[] } {
  const rows = [...initial];
  const published: string[] = [];
  return {
    published,
    enqueue: async () => undefined,
    pullUnpublished: async (limit) =>
      rows.filter((r) => !published.includes(r.id)).slice(0, limit),
    markPublished: async (id) => {
      published.push(id);
    },
  };
}

describe('OutboxRelay', () => {
  it('publishes each unpublished record then marks it published', async () => {
    const store = fakeStore([record('a'), record('b')]);
    const publisher: OutboxPublisher = {
      publish: vi.fn(async () => undefined),
    };

    const relay = new OutboxRelay(store, publisher, { batchSize: 10 });
    const count = await relay.drainOnce();

    expect(count).toBe(2);
    expect(publisher.publish).toHaveBeenCalledTimes(2);
    expect(store.published).toEqual(['a', 'b']);
  });

  it('does not mark a record published when publishing fails (retry next tick)', async () => {
    const store = fakeStore([record('a'), record('b')]);
    const publisher: OutboxPublisher = {
      publish: vi.fn(async (r: OutboxRecord) => {
        if (r.id === 'a') throw new Error('broker down');
      }),
    };

    const relay = new OutboxRelay(store, publisher);
    await expect(relay.drainOnce()).rejects.toThrow('broker down');
    expect(store.published).toEqual([]);
  });
});
