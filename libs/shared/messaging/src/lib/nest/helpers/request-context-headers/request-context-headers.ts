import {
  EMPTY_REQUEST_CONTEXT,
  REQUEST_CONTEXT_HEADER,
  requestContextSchema,
  type RequestContext,
} from '@sanad/contracts';

/** Serialize the caller's circumstances into the RMQ headers map (gateway → service). */
export function requestContextToHeaders(
  context: RequestContext,
): Record<string, string> {
  return { [REQUEST_CONTEXT_HEADER]: JSON.stringify(context) };
}

/**
 * Read the forwarded context back. Degrades to {@link EMPTY_REQUEST_CONTEXT} rather than
 * throwing or returning `null`: this rides on business messages, and a malformed header must
 * cost the audit trail some detail, never cost the client their write.
 */
export function requestContextFromHeaders(
  headers: Record<string, unknown> | undefined,
): RequestContext {
  const raw = headers?.[REQUEST_CONTEXT_HEADER];
  if (typeof raw !== 'string') {
    return EMPTY_REQUEST_CONTEXT;
  }
  try {
    const parsed = requestContextSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : EMPTY_REQUEST_CONTEXT;
  } catch {
    return EMPTY_REQUEST_CONTEXT;
  }
}
