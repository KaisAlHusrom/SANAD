import { z } from 'zod';

/**
 * The CORE response envelope handlers/services produce: `{ success, message, data }`.
 * The backend's global interceptor enriches it into the full wire envelope (adds
 * `path` + `timestamp`); the frontend unwraps `data` in exactly one place (F1).
 * Defined once here so no surface re-invents the shape (U3).
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

/**
 * The full HTTP wire envelope every API returns (N9): the core plus `path` and
 * `timestamp`, added once by the response interceptor / exception filter. The
 * frontend's single unwrap layer reads `data`; `path`/`timestamp` aid debugging.
 */
export const httpEnvelopeSchema = <T extends z.ZodTypeAny>(data: T) =>
  z
    .object({
      success: z.boolean(),
      message: z.string(),
      data,
      path: z.string(),
      timestamp: z.string(),
    })
    .strict();

export interface HttpResponseEnvelope<T> extends ResponseEnvelope<T> {
  path: string;
  timestamp: string;
}
