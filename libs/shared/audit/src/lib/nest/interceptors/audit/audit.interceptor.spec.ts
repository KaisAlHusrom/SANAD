import { describe, expect, it, vi } from 'vitest';
import type { CallHandler, ExecutionContext } from '@nestjs/common';
import { IDENTITY_HEADER } from '@sanad/auth';
import { REQUEST_CONTEXT_HEADER } from '@sanad/contracts';
import { DateTimeService } from '@sanad/database';
import { firstValueFrom, of, throwError } from 'rxjs';
import { AUDITED_METADATA_KEY } from '../../../audit.constants.js';
import type {
  AuditDb,
  AuditRecord,
  AuditStore,
} from '../../../audit-entry.types.js';
import { AuditRecorder } from '../../audit-recorder/audit-recorder.js';
import { AuditInterceptor } from './audit.interceptor.js';

const clock = DateTimeService.fixed('2026-08-09T09:00:00.000Z');
const db = {} as AuditDb;

function fakeStore(): { store: AuditStore; written: AuditRecord[] } {
  const written: AuditRecord[] = [];
  return {
    written,
    store: {
      append: vi.fn(async (_e, records) => void written.push(...records)),
    },
  };
}

/** A Reflector stand-in — the interceptor only ever calls `getAllAndOverride`. */
function reflector(metadata: unknown) {
  return {
    getAllAndOverride: vi.fn(() => metadata),
  } as unknown as ConstructorParameters<typeof AuditInterceptor>[0];
}

/** An RPC execution context carrying the headers the gateway forwards (MS4 + P8.8). */
function rpcContext(headers: Record<string, string>): ExecutionContext {
  return {
    getType: () => 'rpc',
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToRpc: () => ({
      getContext: () => ({
        getMessage: () => ({ properties: { headers } }),
      }),
    }),
  } as unknown as ExecutionContext;
}

function httpContext(request: unknown): ExecutionContext {
  return {
    getType: () => 'http',
    getHandler: () => () => undefined,
    getClass: () => class {},
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

const handlerReturning = (value: unknown): CallHandler =>
  ({ handle: () => of(value) }) as CallHandler;

const audited = { action: 'settings.updated', entityType: 'setting' };

const identityHeaders = {
  [IDENTITY_HEADER]: JSON.stringify({
    userId: 'u-1',
    roles: ['admin'],
    permissions: [],
  }),
  [REQUEST_CONTEXT_HEADER]: JSON.stringify({
    ip: '85.10.1.4',
    userAgent: 'Mozilla/5.0',
    requestId: 'req-1',
  }),
};

describe('AuditInterceptor', () => {
  it('passes an UNMARKED handler straight through and writes nothing', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    const interceptor = new AuditInterceptor(
      reflector(undefined),
      recorder,
      db,
    );
    await expect(
      firstValueFrom(
        interceptor.intercept(rpcContext({}), handlerReturning('ok')),
      ),
    ).resolves.toBe('ok');
    expect(written).toHaveLength(0);
  });

  it('reads metadata under the shared key', () => {
    const reflect = reflector(audited);
    const interceptor = new AuditInterceptor(
      reflect,
      new AuditRecorder(fakeStore().store, clock),
      db,
    );
    void interceptor
      .intercept(rpcContext({}), handlerReturning('ok'))
      .subscribe();
    expect(reflect.getAllAndOverride).toHaveBeenCalledWith(
      AUDITED_METADATA_KEY,
      expect.anything(),
    );
  });

  it('writes a row for a marked handler, with the actor + ip from the RMQ headers', async () => {
    const { store, written } = fakeStore();
    const interceptor = new AuditInterceptor(
      reflector(audited),
      new AuditRecorder(store, clock),
      db,
    );
    await firstValueFrom(
      interceptor.intercept(
        rpcContext(identityHeaders),
        handlerReturning('ok'),
      ),
    );
    expect(written).toHaveLength(1);
    expect(written[0]).toMatchObject({
      action: 'settings.updated',
      entityType: 'setting',
      actorUserId: 'u-1',
      actorRole: 'admin',
      actorType: 'user',
      ip: '85.10.1.4',
      userAgent: 'Mozilla/5.0',
      requestId: 'req-1',
      outcome: 'succeeded',
    });
  });

  // The trap this whole design turns on: an interceptor that calls `als.run(ctx, () =>
  // next.handle())` opens the scope around building the observable, NOT around its execution —
  // the handler then runs outside it and every actor is silently null.
  it('makes the scope visible to code running INSIDE the handler', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    const interceptor = new AuditInterceptor(reflector(audited), recorder, db);
    const handler: CallHandler = {
      handle: () => {
        recorder.record({ action: 'setting.touched', entityType: 'setting' });
        return of('ok');
      },
    };
    await firstValueFrom(
      interceptor.intercept(rpcContext(identityHeaders), handler),
    );
    const touched = written.find((row) => row.action === 'setting.touched');
    expect(touched?.actorUserId).toBe('u-1');
    expect(touched?.ip).toBe('85.10.1.4');
  });

  // The guarantee row exists so a handler that records nothing still leaves a trace. When the
  // handler DOES record, emitting it anyway produced a phantom twin — same action, null entityId,
  // null before/after — doubling the trail and making per-entity queries return rows for entities
  // that were never touched. Caught by the P8.8 runtime gate: one PUT, two rows.
  it('does NOT add a bare guarantee row when the handler recorded its own', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    const interceptor = new AuditInterceptor(reflector(audited), recorder, db);
    const handler: CallHandler = {
      handle: () => {
        recorder.record({
          action: 'settings.updated',
          entityType: 'setting',
          entityId: 'branding.brand.name',
          before: { value: 'a' },
          after: { value: 'b' },
        });
        return of('ok');
      },
    };
    await firstValueFrom(
      interceptor.intercept(rpcContext(identityHeaders), handler),
    );
    expect(written).toHaveLength(1);
    expect(written[0]?.entityId).toBe('branding.brand.name');
  });

  it('does NOT add one when the handler wrote inside its own transaction either', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    const interceptor = new AuditInterceptor(reflector(audited), recorder, db);
    const handler: CallHandler = {
      handle: () => {
        // `recordWithin` persists immediately, inside the caller's tx — it never reaches the
        // buffer, so the interceptor cannot see it by looking at pending entries alone.
        void recorder.recordWithin(db, {
          action: 'settings.updated',
          entityType: 'setting',
          entityId: 'branding.brand.name',
        });
        return of('ok');
      },
    };
    await firstValueFrom(
      interceptor.intercept(rpcContext(identityHeaders), handler),
    );
    expect(written).toHaveLength(1);
  });

  // The mirror image of the two above: suppressing the guarantee row on failure would lose the
  // event entirely, because whatever the handler wrote with `recordWithin` died with its rolled-back
  // transaction. A refused write is evidence too, so failure always leaves a row.
  it('DOES add one on failure, even though the handler recorded', async () => {
    const { store, written } = fakeStore();
    const recorder = new AuditRecorder(store, clock);
    const interceptor = new AuditInterceptor(reflector(audited), recorder, db);
    const failing: CallHandler = {
      handle: () => {
        void recorder.recordWithin(db, {
          action: 'settings.updated',
          entityType: 'setting',
          entityId: 'branding.brand.name',
        });
        return throwError(() => ({ messageKey: 'auth.forbidden' }));
      },
    };
    await expect(
      firstValueFrom(
        interceptor.intercept(rpcContext(identityHeaders), failing),
      ),
    ).rejects.toBeDefined();
    expect(
      written.some(
        (row) =>
          row.outcome === 'failed' && row.failureKey === 'auth.forbidden',
      ),
    ).toBe(true);
  });

  it('records a FAILED outcome with the error’s message key, then rethrows', async () => {
    const { store, written } = fakeStore();
    const interceptor = new AuditInterceptor(
      reflector(audited),
      new AuditRecorder(store, clock),
      db,
    );
    const failing: CallHandler = {
      handle: () =>
        throwError(() => ({ messageKey: 'settings.value.expected.number' })),
    };
    await expect(
      firstValueFrom(
        interceptor.intercept(rpcContext(identityHeaders), failing),
      ),
    ).rejects.toBeDefined();
    expect(written[0]).toMatchObject({
      outcome: 'failed',
      failureKey: 'settings.value.expected.number',
    });
  });

  it('takes the actor from the HTTP request when there is no broker in the path', async () => {
    const { store, written } = fakeStore();
    const interceptor = new AuditInterceptor(
      reflector(audited),
      new AuditRecorder(store, clock),
      db,
    );
    await firstValueFrom(
      interceptor.intercept(
        httpContext({
          identity: { userId: 'u-9', roles: ['staff'], permissions: [] },
          ip: '10.1.2.3',
          headers: { 'user-agent': 'curl/8' },
        }),
        handlerReturning('ok'),
      ),
    );
    expect(written[0]).toMatchObject({
      actorUserId: 'u-9',
      actorRole: 'staff',
      ip: '10.1.2.3',
      userAgent: 'curl/8',
    });
  });

  it('attributes an unauthenticated call to `anonymous`, never to nobody', async () => {
    const { store, written } = fakeStore();
    const interceptor = new AuditInterceptor(
      reflector(audited),
      new AuditRecorder(store, clock),
      db,
    );
    await firstValueFrom(
      interceptor.intercept(rpcContext({}), handlerReturning('ok')),
    );
    expect(written[0]).toMatchObject({
      actorType: 'anonymous',
      actorUserId: null,
    });
  });

  it('NEVER fails the request because the audit write failed — it logs and lets it through', async () => {
    const broken: AuditStore = {
      append: vi.fn(async () => {
        throw new Error('disk full');
      }),
    };
    const interceptor = new AuditInterceptor(
      reflector(audited),
      new AuditRecorder(broken, clock),
      db,
    );
    await expect(
      firstValueFrom(
        interceptor.intercept(
          rpcContext(identityHeaders),
          handlerReturning('ok'),
        ),
      ),
    ).resolves.toBe('ok');
  });
});
