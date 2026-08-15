import { z } from 'zod';

/**
 * The header the CALLER's circumstances ride in, gateway → service (P8.8). Sibling of
 * `x-sanad-identity` (who) and `x-sanad-locale` (in which language): this one carries **from
 * where**, which is the part an audit trail cannot be reconstructed without and which only the
 * gateway's HTTP edge can ever see.
 */
export const REQUEST_CONTEXT_HEADER = 'x-sanad-request-context';

/** The inbound header a proxy/edge may already have set; P8.10 generates one when absent. */
export const REQUEST_ID_HEADER = 'x-request-id';

/**
 * Every field is nullable and the object is NOT strict-required anywhere: a public route, an
 * internal cron, a test harness and a replayed message all legitimately lack some of it. A
 * missing value must degrade to `null` in the audit row, never block the request that carries it.
 */
export const requestContextSchema = z
  .object({
    ip: z.string().min(1).nullable(),
    userAgent: z.string().min(1).nullable(),
    requestId: z.string().min(1).nullable(),
  })
  .strict();

export type RequestContext = z.infer<typeof requestContextSchema>;

/** The "we know nothing about the caller" value — used instead of `undefined`, so reads are total. */
export const EMPTY_REQUEST_CONTEXT: RequestContext = {
  ip: null,
  userAgent: null,
  requestId: null,
};
