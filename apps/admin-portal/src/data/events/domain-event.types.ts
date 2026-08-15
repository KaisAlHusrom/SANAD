import type {
  ClientBusEvent,
  ClientBusEventNameFor,
  ClientBusEventOf,
} from '@sanad/contracts';

/**
 * The admin portal's client-bus union — DERIVED from the `EVENT_CATALOG` (U27c), never
 * restated. Publishing an event the catalog does not declare, or one with the wrong payload,
 * is a compile error; a new admin event is added by adding its `*.event.ts` to the catalog,
 * not by widening a union here. `import type` only — the catalog's zod schemas must never
 * enter this bundle.
 *
 * Alias each of these ONCE (here) and use the alias everywhere: re-deriving
 * `ClientBusEvent<'admin-portal'>` at a call site re-distributes the mapped conditional over
 * the whole catalog every time.
 */
export type DomainEvent = ClientBusEvent<'admin-portal'>;

export type DomainEventType = ClientBusEventNameFor<'admin-portal'>;

/** Narrow a `DomainEvent` to the variant matching a given `type`. */
export type DomainEventOf<T extends DomainEventType> = ClientBusEventOf<
  'admin-portal',
  T
>;
