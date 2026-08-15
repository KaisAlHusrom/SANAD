import type { z } from 'zod';
import type { EventActor } from './event-actor.js';
import type { EventConsumer } from './event-consumer.types.js';
import type { EventTransport } from './event-transport.js';

interface EventDefinitionBase {
  /** The wire name: `<entity>.<event>` on the broker (MS3), `<domain>.<thing>.<verb>` on a bus (W4). */
  readonly name: string;
  readonly transport: EventTransport;
  /** The payload contract. Broker consumers `safeParse` it (U16); a client bus only infers it. */
  readonly payloadSchema: z.ZodTypeAny;
  readonly producer: EventActor;
  /** Repo-relative path of the emit site. */
  readonly producedAt: string;
  readonly description: string;
}

/**
 * A catalogued event (U27c). The union is what turns U27d from a convention into a type law:
 * an entry either lists at least one consumer — a NON-EMPTY tuple, which `consumers: []` does
 * not satisfy — or it declares itself an orphan and MUST say why. `consumers: []` with no
 * `orphanReason` matches neither member; a real consumer list carrying an `orphanReason` is
 * rejected by `orphanReason?: never`. Author every entry `as const satisfies EventDefinition`
 * so the literal tuple survives inference.
 */
export type EventDefinition =
  | (EventDefinitionBase & {
      readonly consumers: readonly [EventConsumer, ...EventConsumer[]];
      readonly orphanReason?: never;
    })
  | (EventDefinitionBase & {
      readonly consumers: readonly [];
      /** Why nothing reacts yet, and which phase owns the consumer (U27d). */
      readonly orphanReason: string;
    });
