import {
  Global,
  Module,
  type DynamicModule,
  type Provider,
} from '@nestjs/common';
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
 * The interceptor is **not** registered globally. `APP_INTERCEPTOR` looked like the right form and
 * is not: `connectMicroservice` builds the microservice with a fresh `ApplicationConfig` unless
 * `inheritAppConfig` is passed, so a global interceptor never reaches a hybrid app's RMQ handlers —
 * which is where every write in this platform arrives. `@Audited()` binds it per handler instead
 * (see the decorator); this module only has to make it *resolvable*, which `@Global()` does.
 *
 * `@Global()` also lets `AuditRecorder` be injected by any application service without each module
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
      AuditInterceptor,
    ];
    return {
      module: AuditModule,
      providers,
      exports: [AuditStore, AuditRecorder, AuditInterceptor],
    };
  }
}
