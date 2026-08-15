# @sanad/messaging

**Purpose:** the RabbitMQ communication primitives shared by every service — the event-contract base, the transactional Outbox interface, and the idempotent-consumer helper (MS2/MS3/MS6). The NestJS RMQ transport wiring (request/reply client, `@EventPattern` consumers) lands with the first service that talks over the broker (P2+).

**Tags:** `scope:shared`, `type:util`. **Deps:** `@nestjs/microservices`, `drizzle-orm`, `rxjs`, **`@sanad/contracts`** (zod dropped with `domain-event.ts` — the payload schemas live in contracts).

## Concepts (`src/lib/`)

| File                     | Exports                                                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| `outbox.ts`              | `OutboxRecord`, **`OutboxEnqueueRecord`**, `OutboxStore` — write business change + outbox row in one tx, no dual-write (MS3) |
| `idempotent-consumer.ts` | `ProcessedStore`, `InMemoryProcessedStore`, `IdempotentConsumer.process()` — exactly-once on redelivery (MS6)                |

**Events:** carries events; it never names one — every event name and payload comes from the
`EVENT_CATALOG` in `@sanad/contracts` (U27).
**Settings:** none.
**Tests:** `idempotent-consumer.spec.ts`, `nest/outbox/outbox-record/outbox-record.spec.ts`.

## P2 additions — NestJS adapters (`src/lib/nest`, U20)

- **transports/** — `createRmqServerOptions`/`createRmqClientOptions` + `commandsQueue`/`eventsQueue` (MS6).
- **helpers/** — `sendRequest` (request/reply with timeout+catchError, MS2), `readMessageHeaders`.
- **outbox/** — `outboxTable`, `DrizzleOutboxStore`, `OutboxRelay` + `clientProxyPublisher`, `createOutboxRecord` (transactional Outbox, MS3).

## P8.7 changes — the publish path is typed against the `EVENT_CATALOG` (U27)

- **`OutboxEnqueueRecord`** narrows the WRITE side to `eventName: BrokerEventName`. The persisted
  `OutboxRecord` keeps a plain `string`, so the relay still reads rows back without a cast — only
  what the application may _append_ is constrained.
- **`createOutboxRecord<TName extends BrokerEventName>(name, payload: EventPayloadOf<TName>, occurredAt)`**
  — two compile-time gates in one signature: an un-catalogued name fails, and so does a payload that
  does not match _that_ name's catalogued schema. It moved into its own concept folder (U26).
- **Deleted as dead code:** `domain-event.ts` (`DomainEvent<TName,TPayload>`, `EventContract`,
  `defineEvent()`, `EventPayloadOf<>`) and `message-pattern.ts` (`requestPattern()`,
  `eventPattern()`) — referenced by nothing but their own spec. They also could not have hosted the
  catalog: `@sanad/contracts` is `type:types` and may import nothing internal, so the dependency runs
  **contracts ← messaging**, never the other way, and keeping both would have exported two different
  `EventPayloadOf` from two packages (U3). The real RMQ patterns live in each domain's
  `message-pattern.ts` in `@sanad/contracts`.
- A bare `client.emit(...)` / `this.client.emit(...)` inside `apps/**` is now an ESLint error (root config, MS3/U27, selectors in `tools/lint/ms3-bare-emit/` and probed both ways) — the one
  Outbox bypass no type can see, because both the name and the payload would be legal.

## P8.8 addition — the request-context header (sibling of MS4 identity)

- **`nest/helpers/request-context-headers/`** — `requestContextToHeaders` /
  `requestContextFromHeaders` for **`x-sanad-request-context`**, carrying the caller's **ip,
  user-agent and request id** gateway→service. Identity says _who_ (`@sanad/auth`), locale says _in
  which language_ (`@sanad/i18n`), this says _from where_ — the part an audit row (P8.8) cannot be
  reconstructed without and that only the gateway's HTTP edge can see.
- It lives here rather than in `@sanad/auth` because it is transport context, not identity, and this
  package already owns `readMessageHeaders`. The header constant + schema are in `@sanad/contracts`
  (U3), so a browser app could read them without pulling NestJS in.
- A malformed header degrades to `EMPTY_REQUEST_CONTEXT`, never throws: it rides on business
  messages, and it must cost the trail some detail rather than cost the client their write (U23).
