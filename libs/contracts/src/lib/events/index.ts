// The event catalog (U27) — every event the platform emits, on either bus, declared once.
// The individual `*.event.ts` consts are deliberately NOT re-exported: `EVENT_CATALOG` is the
// single entry point (U3). Barrel only (U10).
export * from './event-actor.js';
export * from './event-transport.js';
export * from './event-consumer.types.js';
export * from './event-definition.types.js';
export * from './define-catalog/index.js';
export * from './event-catalog/index.js';
