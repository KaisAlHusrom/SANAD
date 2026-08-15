# 03 — Microservices Platform

> The deep design for the network boundary: gateway, RabbitMQ patterns, Outbox, idempotency, sagas, database-per-service, observability, lifecycle. Grounded in current NestJS/Nx/RabbitMQ best practice. Rules MS1–MS9 enforce this.

## North star (read first)

Microservices are an **explicit, incremental** choice here (learning + service reuse), not a default. The field consensus: start with a few coarse, **strictly-bounded** services and extract more later. Nx tags make the boundaries real _before_ extraction. Build the expensive-to-retrofit things from day one — **DB-per-service, Outbox, idempotency** — and add services only when a lib's boundary has proven stable (MS9). Avoid the distributed monolith (don't split by technical layer; split by bounded context).

## API gateway

- The **only** public entry (MS4). A normal NestJS HTTP app holding one `ClientProxy` per service (`ClientsModule.registerAsync`, RMQ transport, config from the env accessor).
- **Auth:** validates the JWT once; forwards `{ userId, roles }` in RMQ **message headers** to the trusted internal network — never the raw token. Sensitive services may re-validate (defense-in-depth).
- **Reads:** `client.send(pattern, payload).pipe(timeout(MS), catchError(...))`. Aggregate multi-service reads with `forkJoin` / `Promise.all(firstValueFrom(...))` (API composition). Put non-trivial aggregation in a service behind the gateway, not in the gateway.
- **Writes/events:** `client.emit(pattern, payload)`.
- Applies global envelope interceptor + exception filter + Zod validation (from `libs/shared/util`).
- **Production:** front the Nest gateway with **nginx** (TLS, rate-limit, WAF, HA) — the Nest app is routing, not the hardened edge. Run it with replicas so it isn't a SPoF.

## RabbitMQ message patterns

- **Request/reply** (`@MessagePattern`) for cross-service **reads** that need an answer now. The caller **MUST** add `timeout()` + `catchError` (no built-in timeout). Exactly one responder per pattern. `client.send` is a **cold** Observable — it only fires on subscribe (`firstValueFrom`).
- **Events** (`@EventPattern`) for **writes/side-effects** — fire-and-forget, multiple independent consumers.
- **Delivery config (MS6):** **manual ack** (`noAck:false`), `queueOptions.durable:true`, `persistent:true`, a sensible `prefetchCount` (only throttles when `noAck:false`). Ack exactly once via `RmqContext` (double-ack closes the channel). On permanent failure → DLQ + retry counter, **never** infinite `nack(requeue=true)`.
- **Transport config** lives once in `libs/shared/messaging` (urls, queue naming convention `<service>.commands` / `<service>.events`, options).

## Transactional Outbox (MS3)

Never dual-write to DB + broker. Pattern:

1. In the business local transaction, also insert a row into the service's `outbox` table (`id`, `aggregate`, `event_type`, `payload`, `created_at`, `published_at`).
2. A **relay** (polling publisher to start — simple; upgrade to log-tailing/CDC later if needed) reads unpublished rows and `emit`s them, marking `published_at`.
3. At-least-once → every consumer is **idempotent**.

- `libs/shared/messaging` provides the `outbox` table helper + the relay worker; each service owns its own `outbox` table (DB-per-service).

## Idempotent consumers (MS6)

- Each consuming service has a `processed_message` table (`consumer_id`, `message_id`, PK). In the **same transaction** as the business update, insert the processed-message row; a duplicate insert fails → the whole handler rolls back → no double-effect.
- Every message carries a stable `messageId` / idempotency key (set at publish).

## Sagas (MS7)

- Multi-service writes use a **saga**, **choreography first** (services react to each other's events), with **compensating actions** (no 2PC, no cross-service ACID). Compensations are idempotent. Move to an orchestrated saga only when a flow gets complex enough to need central visibility.
- Example (later): `phase.signed_off` → finance creates a milestone invoice → on failure, emit `invoice.creation_failed` → projects reopens the phase gate.

## Database-per-service (MS5)

- Each service owns its DB; **no shared DB, no cross-service joins**. Cross-service data needs come via request/reply (MS2) or a CQRS read model fed by events (when in-memory composition gets inefficient).
- **Drizzle per service:** own `drizzle.config.ts`, `db/schema`, migrations folder; `drizzle-kit generate` → `migrate` (a dedicated migration step/container in deploy, never `push` in prod). **Collision guard:** a distinct database per service (preferred) — or a distinct `migrations.table`/`schema` if sharing one Postgres instance in dev — so the `drizzle.__drizzle_migrations` table doesn't collide. `COPY` the migrations folder into the service image.

## Cross-cutting

- **Observability:** OpenTelemetry + W3C trace-context; `@opentelemetry/instrumentation-amqplib` injects/extracts `traceparent` through AMQP headers (producer + consumer both instrumented). Use OTel trace IDs over bespoke correlation IDs.
- **Health:** `@nestjs/terminus` — **separate liveness + readiness**; DB ping + RMQ reachability (note: RMQ indicator checks broker reachability, not consumption — consider a custom check).
- **Config:** `ConfigModule` global, validate env at startup, **fail fast**; typed namespaces; secrets from env (U14/U19).
- **Graceful shutdown (MS8):** `app.enableShutdownHooks()`. Stock `ServerRMQ` doesn't cancel the consumer on shutdown → use a graceful wrapper that captures the `consumerTag`, tracks in-flight messages, cancels the consumer on `close()`, and drains with a bounded timeout (requires `noAck:false` + `prefetch`). Readiness flips to failing before exit (zero-downtime rollover).

## Service inventory & sequencing

- **Now (MVP):** `api-gateway`, `identity`, `settings`, `content`, `media`, `notifications`. (`analytics` may start as a module, graduate later.)
- **Later:** `projects`, `crm`, `hr`, `finance`, `support`, `documents`, `ai-assistant` — each created by promoting a stable lib to an app (MS9), with its own DB, Outbox, and idempotent consumers from day one.

## Event catalog (seed — keep updated)

| Event                      | Producer | Consumers                             | Notes                        |
| -------------------------- | -------- | ------------------------------------- | ---------------------------- |
| `lead.created`             | content  | notifications, crm(later)             | website contact/request form |
| `user.registered`          | identity | notifications                         | welcome + verify             |
| `user.role.changed`        | identity | (audit later)                         |                              |
| `media.deleted`            | media    | content                               | reconcile references         |
| `phase.signed_off` (later) | projects | finance, notifications, client-portal | milestone billing trigger    |
| `invoice.paid` (later)     | finance  | projects, notifications               |                              |

## Anti-patterns to refuse

Distributed monolith (chatty sync chains, split-by-layer) · shared database · sync call chains without timeout/circuit-breaker · assuming ACID across services · skipping the Outbox ("I'll just publish after save") · infinite requeue · shipping without tracing/health. Any of these → stop and fix.
