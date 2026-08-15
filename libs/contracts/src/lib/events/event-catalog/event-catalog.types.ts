import type { z } from 'zod';
import type { EventActor } from '../event-actor.js';
import type { EVENT_CATALOG } from './event-catalog.js';

type Catalog = typeof EVENT_CATALOG;

/** Every event name the platform knows (U27c). */
export type EventName = keyof Catalog & string;

export type EventDefinitionOf<TName extends EventName> = Catalog[TName];

/** The payload of a catalogued event — inferred from its schema, never restated (U3/U16). */
export type EventPayloadOf<TName extends EventName> = z.infer<
  EventDefinitionOf<TName>['payloadSchema']
>;

/** Names carried by RabbitMQ. The Outbox will not enqueue anything else (MS3). */
export type BrokerEventName = {
  [TName in EventName]: EventDefinitionOf<TName>['transport'] extends 'broker'
    ? TName
    : never;
}[EventName];

export type ClientBusEventName = {
  [TName in EventName]: EventDefinitionOf<TName>['transport'] extends 'client-bus'
    ? TName
    : never;
}[EventName];

/** The client-bus names one app produces — each app's bus sees only its own events (W4). */
export type ClientBusEventNameFor<TActor extends EventActor> = {
  [TName in ClientBusEventName]: EventDefinitionOf<TName>['producer'] extends TActor
    ? TName
    : never;
}[ClientBusEventName];

/**
 * The discriminated union a client bus publishes and subscribes: `{ type }` plus the payload's
 * own fields, FLAT. Derived from the catalog, so an event the catalog never heard of cannot be
 * published (U27c). Alias it ONCE per app — re-deriving it at call sites re-distributes the
 * mapped conditional over the whole catalog every time.
 */
export type ClientBusEvent<TActor extends EventActor> = {
  [TName in ClientBusEventNameFor<TActor>]: {
    type: TName;
  } & EventPayloadOf<TName>;
}[ClientBusEventNameFor<TActor>];

export type ClientBusEventOf<
  TActor extends EventActor,
  TName extends ClientBusEventNameFor<TActor>,
> = Extract<ClientBusEvent<TActor>, { type: TName }>;
