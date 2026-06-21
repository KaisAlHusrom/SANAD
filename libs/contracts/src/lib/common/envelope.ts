import { z } from 'zod';

/**
 * The single response envelope every API returns: `{ success, message, data }`.
 * The frontend unwraps it in exactly one place (F1); the backend wraps it in one
 * interceptor. Defined once here so no surface re-invents the shape (U3).
 */
export const envelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z
    .object({
      success: z.boolean(),
      message: z.string(),
      data,
    })
    .strict();

export interface ResponseEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
}
