import { describe, expect, it } from 'vitest';
import { Module } from '@nestjs/common';
import { ApplicationConfig } from '@nestjs/core';
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

  it('registers the interceptor GLOBALLY — the only form that reaches RMQ handlers', async () => {
    // Asserted against the initialised application's own config, not the provider token: what
    // matters is that Nest ended up with it in its GLOBAL interceptor list, which is the
    // property `app.useGlobalInterceptors` would fail to give a hybrid app's RMQ side.
    const moduleRef = await Test.createTestingModule({
      imports: [HostModule],
    }).compile();
    const app = moduleRef.createNestApplication();
    await app.init();

    const globals = app.get(ApplicationConfig).getGlobalInterceptors();
    expect(globals.some((one) => one instanceof AuditInterceptor)).toBe(true);
    await app.close();
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
