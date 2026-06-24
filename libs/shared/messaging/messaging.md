# @sanad/messaging

**Purpose:** the RabbitMQ communication primitives shared by every service — the event-contract base, the transactional Outbox interface, and the idempotent-consumer helper (MS2/MS3/MS6). The NestJS RMQ transport wiring (request/reply client, `@EventPattern` consumers) lands with the first service that talks over the broker (P2+).

**Tags:** `scope:shared`, `type:util`. **Deps:** `zod`.

## Concepts (`src/lib/`)

| File                     | Exports                                                                                                       |
| ------------------------ | ------------------------------------------------------------------------------------------------------------- |
| `domain-event.ts`        | `DomainEvent<TName,TPayload>`, `EventContract`, `defineEvent()`, `EventPayloadOf<>` (U3)                      |
| `outbox.ts`              | `OutboxRecord`, `OutboxStore` — write business change + outbox row in one tx, no dual-write (MS3)             |
| `idempotent-consumer.ts` | `ProcessedStore`, `InMemoryProcessedStore`, `IdempotentConsumer.process()` — exactly-once on redelivery (MS6) |
| `message-pattern.ts`     | `requestPattern()` (reads, MS2), `eventPattern()` (writes, MS3)                                               |

**Events:** defines the carrier types; concrete event contracts live with their owning service.
**Settings:** none.
**Tests:** `idempotent-consumer.spec.ts`, `domain-event.spec.ts`.

## P2 additions — NestJS adapters (`src/lib/nest`, U20)

- **transports/** — `createRmqServerOptions`/`createRmqClientOptions` + `commandsQueue`/`eventsQueue` (MS6).
- **helpers/** — `sendRequest` (request/reply with timeout+catchError, MS2), `readMessageHeaders`.
- **outbox/** — `outboxTable`, `DrizzleOutboxStore`, `OutboxRelay` + `clientProxyPublisher`, `createOutboxRecord` (transactional Outbox, MS3).
