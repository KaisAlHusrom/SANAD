import {
  Global,
  Module,
  type DynamicModule,
  type Provider,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { DateTimeService } from '@sanad/database';
import { AuditStore } from '../audit-entry.types.js';
import { DrizzleAuditStore } from '../drizzle-audit-store/drizzle-audit-store.js';
import { AuditRecorder } from './audit-recorder/audit-recorder.js';
import { AuditInterceptor } from './interceptors/audit/audit.interceptor.js';

/**
 * Wires the audit trail into a service (P8.8). Import `AuditModule.forRoot()` in the service's
 * `AppModule`, after `DrizzleModule.forRoot()` — the interceptor resolves the `DRIZZLE` handle
 * to flush with, and the service must have mounted `auditLogTable` in its own schema (MS5).
 *
 * `APP_INTERCEPTOR` rather than `app.useGlobalInterceptors(...)` in `main.ts`: only the
 * module-provided form is bound to the whole application container, so it covers a hybrid app's
 * **RMQ** handlers as well as its HTTP ones — and every write in this platform arrives over RMQ.
 *
 * `@Global()` so `AuditRecorder` can be injected by any application service without each module
 * re-importing this one; the recorder is the only symbol services touch.
 */
@Global()
@Module({})
export class AuditModule {
  static forRoot(): DynamicModule {
    const providers: Provider[] = [
      { provide: AuditStore, useClass: DrizzleAuditStore },
      {
        provide: AuditRecorder,
        inject: [AuditStore, DateTimeService],
        useFactory: (store: AuditStore, clock: DateTimeService) =>
          new AuditRecorder(store, clock),
      },
      { provide: APP_INTERCEPTOR, useClass: AuditInterceptor },
    ];
    return {
      module: AuditModule,
      providers,
      exports: [AuditStore, AuditRecorder],
    };
  }
}
