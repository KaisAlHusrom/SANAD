import { describe, expect, it } from 'vitest';
import { Module } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { DateTimeService, DrizzleModule } from '@sanad/database';
import { AuditStore } from '../../audit-entry.types.js';
import { AuditRecorder } from '../audit-recorder/audit-recorder.js';
import { AuditInterceptor } from '../interceptors/audit/audit.interceptor.js';
import { AuditModule } from '../audit.module.js';

/**
 * Compiles the REAL Nest container — the check that was missing when `AuditModule` shipped.
 *
 * Every unit spec in this lib constructs its subject directly (`new AuditRecorder(store, clock)`),
 * so the module's provider graph was never exercised: 38 green tests, and settings-service still
 * crash-looped at boot with `Nest can't resolve dependencies of the AuditRecorder (AuditStore, ?)`
 * because `DateTimeService` was an **AppModule-local** provider and a module's own providers are
 * invisible to the modules it imports. `@Global()` governs exports, not imports, so it could not
 * help. The fix is that the already-global `DrizzleModule` now provides + exports the clock; this
 * spec is what makes the fix hold — it fails if either half regresses.
 *
 * `DrizzleModule.forRoot` builds a `pg.Pool`, which does NOT connect until a query, so compiling
 * the graph needs no database.
 */
@Module({
  imports: [
    DrizzleModule.forRoot({
      connectionString: 'postgresql://unused:unused@127.0.0.1:1/unused',
      schema: {},
    }),
    AuditModule.forRoot(),
  ],
})
class HostModule {}

describe('AuditModule.forRoot (the container actually compiles)', () => {
  it('resolves AuditRecorder without the host app providing a clock of its own', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HostModule],
    }).compile();

    expect(moduleRef.get(AuditRecorder, { strict: false })).toBeInstanceOf(
      AuditRecorder,
    );
    expect(moduleRef.get(AuditStore, { strict: false })).toBeDefined();
    await moduleRef.close();
  });

  it('makes the interceptor RESOLVABLE, so `@Audited()` can bind it per handler', async () => {
    // Deliberately NOT `ApplicationConfig.getGlobalInterceptors()`. That assertion passed for the
    // whole of P8.8 and proved nothing: a global interceptor does not reach a hybrid app's RMQ
    // handlers, so the trail recorded a `system` actor on every real write. What the module owes
    // is a resolvable provider; `audited-rpc.spec.ts` proves the binding actually fires.
    const moduleRef = await Test.createTestingModule({
      imports: [HostModule],
    }).compile();

    expect(moduleRef.get(AuditInterceptor, { strict: false })).toBeInstanceOf(
      AuditInterceptor,
    );
    await moduleRef.close();
  });

  it('exports the clock from the global DrizzleModule, so an imported module can inject it', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [HostModule],
    }).compile();

    expect(moduleRef.get(DateTimeService, { strict: false })).toBeInstanceOf(
      DateTimeService,
    );
    await moduleRef.close();
  });
});
