// @sanad/messaging — RMQ contract base, Outbox, idempotent consumer, plus the NestJS
// adapters (RMQ transport, request/reply, Drizzle outbox + relay). U10 barrel.
export * from './lib/domain-event.js';
export * from './lib/outbox.js';
export * from './lib/idempotent-consumer.js';
export * from './lib/message-pattern.js';
export * from './lib/nest/index.js';
