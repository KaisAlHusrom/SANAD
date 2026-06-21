import { z } from 'zod';

/**
 * A domain event emitted across services. Carries a stable id (for idempotency,
 * MS6), a name, a typed payload, and when it occurred.
 */
export interface DomainEvent<TName extends string, TPayload> {
  id: string;
  name: TName;
  payload: TPayload;
  occurredAt: string;
}

/** A named event contract backed by a Zod schema (single source of truth, U3). */
export interface EventContract<
  TName extends string,
  TSchema extends z.ZodTypeAny,
> {
  readonly name: TName;
  readonly schema: TSchema;
}

/** Declare an event contract: its routing name + payload schema. */
export function defineEvent<TName extends string, TSchema extends z.ZodTypeAny>(
  name: TName,
  schema: TSchema,
): EventContract<TName, TSchema> {
  return { name, schema };
}

/** The payload type of an event contract. */
export type EventPayloadOf<TContract> =
  TContract extends EventContract<string, infer TSchema>
    ? z.infer<TSchema>
    : never;
