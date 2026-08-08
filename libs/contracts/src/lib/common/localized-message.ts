import { z } from 'zod';

/**
 * A message the backend emits as a **key + params**, never as prose (U24). Services
 * throw/return this shape; the gateway edge renders it into the caller's locale exactly
 * once (the response interceptor + exception filter). Defined here because the shape
 * crosses the RMQ **and** HTTP boundaries, so it is a contract (U3).
 *
 * `params` are interpolated into the catalog string as `{name}` — values are already
 * display-ready (an id, a count, a bucket name), never objects.
 */
export const localizedMessageSchema = z
  .object({
    messageKey: z.string().min(1),
    params: z.record(z.union([z.string(), z.number()])).optional(),
  })
  .strict();

export type LocalizedMessage = z.infer<typeof localizedMessageSchema>;

/** Params interpolated into a catalog string. */
export type MessageParams = NonNullable<LocalizedMessage['params']>;

/**
 * Narrow an arbitrary value (an RMQ error payload, a Nest `HttpException` response) to a
 * localized message. Deliberately **structural, not `.strict()`**: an exception response
 * carries siblings like `statusCode`/`error`/`errors` alongside the key, and those must not
 * stop the filter from translating it.
 */
export function isLocalizedMessage(value: unknown): value is LocalizedMessage {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const { messageKey, params } = value as {
    messageKey?: unknown;
    params?: unknown;
  };
  if (typeof messageKey !== 'string' || messageKey.length === 0) {
    return false;
  }
  return (
    params === undefined ||
    localizedMessageSchema.shape.params.safeParse(params).success
  );
}
