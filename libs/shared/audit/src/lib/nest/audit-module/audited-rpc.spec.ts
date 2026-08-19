import { firstValueFrom } from 'rxjs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Controller, Module, type INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  ClientProxyFactory,
  MessagePattern,
  Transport,
  type ClientProxy,
} from '@nestjs/microservices';
import { DrizzleModule } from '@sanad/database';
import {
  AuditStore,
  type AuditDb,
  type AuditRecord,
} from '../../audit-entry.types.js';
import { Audited } from '../decorators/audited.decorator.js';
import { AuditModule } from '../audit.module.js';

/**
 * The gap that let P8.8 ship an audit trail with no actor on it.
 *
 * `AuditModule` registered the interceptor with `APP_INTERCEPTOR`, and a spec asserted it landed
 * in `ApplicationConfig.getGlobalInterceptors()` — which is true, and irrelevant to a hybrid app.
 * `NestApplication.connectMicroservice` builds the microservice with `new ApplicationConfig()`
 * unless `inheritAppConfig` is passed (nest-application.js: `inheritAppConfig ? this.config : new
 * ApplicationConfig()`), so the RMQ side inherits **no** global interceptor. Every write in this
 * platform arrives over RMQ, so the trail recorded rows with a `system` actor and a null ip.
 *
 * `inheritAppConfig: true` is not the fix: it would also hand the microservice the HTTP
 * `ResponseEnvelopeInterceptor` and `AllExceptionsFilter`, wrapping every RMQ reply and breaking
 * cross-service reads. `@Audited()` binds its own interceptor instead — one decorator, identical
 * behaviour on HTTP and RPC, and nothing for a service's `main.ts` to remember.
 *
 * TCP rather than RMQ so this is a real `rpc` ExecutionContext through the real Nest transport
 * layer with no broker running.
 */
const PROBE_PORT = 8799;
const PROBE_PATTERN = 'audit.probe';

class CapturingAuditStore implements AuditStore {
  readonly rows: AuditRecord[] = [];
  append(_exec: AuditDb, records: AuditRecord[]): Promise<void> {
    this.rows.push(...records);
    return Promise.resolve();
  }
}

@Controller()
class ProbeMessageController {
  @Audited({ action: 'probe.updated', entityType: 'probe' })
  @MessagePattern(PROBE_PATTERN)
  run(): { ok: true } {
    return { ok: true };
  }
}

@Module({
  imports: [
    DrizzleModule.forRoot({
      connectionString: 'postgresql://unused:unused@127.0.0.1:1/unused',
      schema: {},
    }),
    AuditModule.forRoot(),
  ],
  controllers: [ProbeMessageController],
})
class HostModule {}

describe('@Audited on an RMQ-style handler (the hybrid-app gap)', () => {
  const store = new CapturingAuditStore();
  let app: INestApplication;
  let client: ClientProxy;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [HostModule] })
      .overrideProvider(AuditStore)
      .useValue(store)
      .compile();

    app = moduleRef.createNestApplication();
    app.connectMicroservice({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: PROBE_PORT },
    });
    await app.init();
    await app.startAllMicroservices();

    client = ClientProxyFactory.create({
      transport: Transport.TCP,
      options: { host: '127.0.0.1', port: PROBE_PORT },
    });
    await client.connect();
  });

  afterAll(async () => {
    await client?.close();
    await app?.close();
  });

  it('writes a row for a handler reached over the microservice transport', async () => {
    store.rows.length = 0;

    const reply = await firstValueFrom(client.send(PROBE_PATTERN, {})).catch(
      (error: unknown) => {
        throw new Error(`handler failed: ${JSON.stringify(error)}`);
      },
    );
    expect(reply).toEqual({ ok: true });

    expect(store.rows).toHaveLength(1);
    expect(store.rows[0]).toMatchObject({
      action: 'probe.updated',
      entityType: 'probe',
      outcome: 'succeeded',
    });
  });
});
