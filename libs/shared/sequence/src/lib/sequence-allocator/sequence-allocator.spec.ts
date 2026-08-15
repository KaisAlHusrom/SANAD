import { describe, expect, it, vi } from 'vitest';
import { SEQUENCE_FORMAT_DEFAULTS } from '@sanad/contracts';
import { DateTimeService } from '@sanad/database';
import type { SequenceDb, SequenceStore } from '../sequence-store.types.js';
import { SequenceAllocator } from './sequence-allocator.js';

const exec = {} as SequenceDb;

function storeReturning(...values: number[]): SequenceStore {
  const queue = [...values];
  return { allocate: vi.fn(async () => queue.shift() ?? 0) };
}

describe('SequenceAllocator', () => {
  it('allocates and formats in one call', async () => {
    const allocator = new SequenceAllocator(
      storeReturning(1),
      DateTimeService.fixed('2026-05-01T00:00:00.000Z'),
    );
    await expect(allocator.next(exec, 'proposal')).resolves.toEqual({
      number: 'PRO-2026-0001',
      value: 1,
      period: '2026',
    });
  });

  it('passes the kind and the resolved period to the counter', async () => {
    const store = storeReturning(9);
    const allocator = new SequenceAllocator(
      store,
      DateTimeService.fixed('2027-01-02T00:00:00.000Z'),
    );
    await allocator.next(exec, 'contract');
    expect(store.allocate).toHaveBeenCalledWith(exec, 'contract', '2027');
  });

  it('uses an OVERRIDE format when one is supplied (the P8.9 settings path)', async () => {
    const allocator = new SequenceAllocator(
      storeReturning(3),
      DateTimeService.fixed('2026-05-01T00:00:00.000Z'),
    );
    const result = await allocator.next(exec, 'invoice', {
      prefix: 'SND',
      reset: 'never',
      padding: 5,
      separator: '/',
    });
    expect(result.number).toBe('SND/00003');
  });

  it('falls back to the coded default when no override is given (U9)', async () => {
    const allocator = new SequenceAllocator(
      storeReturning(1),
      DateTimeService.fixed('2026-05-01T00:00:00.000Z'),
    );
    const result = await allocator.next(exec, 'document');
    expect(
      result.number.startsWith(SEQUENCE_FORMAT_DEFAULTS.document.prefix),
    ).toBe(true);
  });

  it('REJECTS an invalid override rather than printing a malformed number', async () => {
    const allocator = new SequenceAllocator(
      storeReturning(1),
      DateTimeService.fixed('2026-05-01T00:00:00.000Z'),
    );
    await expect(
      allocator.next(exec, 'proposal', {
        prefix: 'bad prefix',
        reset: 'yearly',
        padding: 4,
        separator: '-',
      }),
    ).rejects.toThrow();
  });
});
