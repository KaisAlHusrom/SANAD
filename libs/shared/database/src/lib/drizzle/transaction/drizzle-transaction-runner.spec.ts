import { describe, expect, it } from 'vitest';
import type { NodePgDatabase } from 'drizzle-orm/node-postgres';
import type { RepoDb } from '../repository/repository.types.js';
import { DrizzleTransactionRunner } from './drizzle-transaction-runner.js';

/** A fake db whose `transaction` invokes the callback with a sentinel tx (no real DB). */
function fakeDb(tx: RepoDb): NodePgDatabase<Record<string, never>> {
  return {
    transaction: (work: (tx: RepoDb) => Promise<unknown>) => work(tx),
  } as unknown as NodePgDatabase<Record<string, never>>;
}

describe('DrizzleTransactionRunner (N14 Unit-of-Work port)', () => {
  const tx = { __tx: true } as unknown as RepoDb;

  it('returns the work callback result', async () => {
    const runner = new DrizzleTransactionRunner(fakeDb(tx));
    await expect(runner.run(async () => 42)).resolves.toBe(42);
  });

  it('yields the open transaction to the work callback', async () => {
    const runner = new DrizzleTransactionRunner(fakeDb(tx));
    const seen = await runner.run(async (received) => received);
    expect(seen).toBe(tx);
  });

  it('propagates a throw from the work callback (rollback semantics)', async () => {
    const runner = new DrizzleTransactionRunner(fakeDb(tx));
    await expect(
      runner.run(async () => {
        throw new Error('boom');
      }),
    ).rejects.toThrow('boom');
  });
});
