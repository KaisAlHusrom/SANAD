import { describe, expect, it, vi } from 'vitest';
import { EMPTY_REQUEST_CONTEXT } from '@sanad/contracts';
import { DateTimeService } from '@sanad/database';
import type {
  AuditDb,
  AuditRecord,
  AuditScope,
  AuditStore,
} from '../../audit-entry.types.js';
import { AuditRecorder } from './audit-recorder.js';

const clock = DateTimeService.fixed('2026-08-09T09:00:00.000Z');
const exec = {} as AuditDb;

const scope: AuditScope = {
  actor: { userId: 'u-1', role: 'admin', type: 'user' },
  context: { ip: '85.10.1.4', userAgent: 'Mozilla/5.0', requestId: 'req-1' },
};

function fakeStore(): { store: AuditStore; written: AuditRecord[] } {
  const written: AuditRecord[] = [];
  return {
    written,
    store: {
      append: vi.fn(async (_exec: AuditDb, records: readonly AuditRecord[]) => {
        written.push(...records);
      }),
    },
  };
}

describe('AuditRecorder', () => {
  it('stamps actor + circumstances from the scope, so a service never plumbs them', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    await recorder.runInScope(scope, async () => {
      recorder.record({
        action: 'settings.updated',
        entityType: 'setting',
        entityId: 'x',
      });
      await recorder.flush(exec);
    });
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({
      actorUserId: 'u-1',
      actorRole: 'admin',
      actorType: 'user',
      action: 'settings.updated',
      entityId: 'x',
      ip: '85.10.1.4',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-1',
      outcome: 'succeeded',
      occurredAt: '2026-08-09T09:00:00.000Z',
    });
  });

  it('writes IMMEDIATELY through `recordWithin`, so the row commits with the business write', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    await recorder.runInScope(scope, async () => {
      await recorder.recordWithin(exec, {
        action: 'settings.updated',
        entityType: 'setting',
      });
      expect(written).toHaveLength(1); // already persisted, before any flush
      await recorder.flush(exec); // and NOT written a second time
    });
    expect(written).toHaveLength(1);
  });

  it('buffers `record` until flush, then empties — a double flush writes nothing twice', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    await recorder.runInScope(scope, async () => {
      recorder.record({ action: 'a.b', entityType: 't' });
      expect(written).toHaveLength(0);
      await recorder.flush(exec);
      await recorder.flush(exec);
    });
    expect(written).toHaveLength(1);
  });

  it('marks every buffered entry failed when the handler blew up', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    await recorder.runInScope(scope, async () => {
      recorder.record({ action: 'a.b', entityType: 't' });
      await recorder.flush(exec, {
        outcome: 'failed',
        failureKey: 'common.internalError',
      });
    });
    expect(written[0]).toMatchObject({
      outcome: 'failed',
      failureKey: 'common.internalError',
    });
  });

  it('keeps concurrent scopes apart — two requests never mix actors', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    await Promise.all([
      recorder.runInScope(scope, async () => {
        recorder.record({ action: 'a.one', entityType: 't' });
        await new Promise((resolve) => setTimeout(resolve, 10));
        await recorder.flush(exec);
      }),
      recorder.runInScope(
        {
          actor: { userId: 'u-2', role: 'staff', type: 'user' },
          context: EMPTY_REQUEST_CONTEXT,
        },
        async () => {
          recorder.record({ action: 'a.two', entityType: 't' });
          await recorder.flush(exec);
        },
      ),
    ]);
    const byAction = Object.fromEntries(
      written.map((row) => [row.action, row.actorUserId]),
    );
    expect(byAction).toEqual({ 'a.one': 'u-1', 'a.two': 'u-2' });
  });

  it('records OUTSIDE a scope as a system actor rather than throwing', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    recorder.record({ action: 'seed.ran', entityType: 'seed' });
    await recorder.flush(exec);
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({
      actorType: 'system',
      actorUserId: null,
      ip: null,
    });
  });

  it('REFUSES a malformed action name — the trail must stay queryable', async () => {
    const { store } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    expect(() =>
      recorder.record({ action: 'updated', entityType: 't' }),
    ).toThrow(/action/i);
    expect(() =>
      recorder.record({ action: 'Settings Updated', entityType: 't' }),
    ).toThrow();
  });

  it('reduces before/after to the CHANGED fields', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    await recorder.runInScope(scope, async () => {
      recorder.record({
        action: 'settings.updated',
        entityType: 'setting',
        before: { a: 1, b: 2 },
        after: { a: 1, b: 3 },
      });
      await recorder.flush(exec);
    });
    expect(written[0]?.before).toEqual({ b: 2 });
    expect(written[0]?.after).toEqual({ b: 3 });
  });
});
