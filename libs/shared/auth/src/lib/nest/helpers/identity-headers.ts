import {
  identityContextSchema,
  type IdentityContext,
} from '../../identity-context.js';

/**
 * The RMQ message header the gateway forwards the validated identity in (MS4) — the
 * gateway validates the JWT once and passes `{ userId, roles, permissions }`, never
 * the raw token. Internal services read it back and trust it.
 */
export const IDENTITY_HEADER = 'x-sanad-identity';

/** Serialize an identity into the RMQ headers map (gateway → service). */
export function identityToHeaders(
  identity: IdentityContext,
): Record<string, string> {
  return { [IDENTITY_HEADER]: JSON.stringify(identity) };
}

/** Read + validate the forwarded identity from RMQ headers; null if absent/invalid. */
export function identityFromHeaders(
  headers: Record<string, unknown> | undefined,
): IdentityContext | null {
  const raw = headers?.[IDENTITY_HEADER];
  if (typeof raw !== 'string') {
    return null;
  }
  try {
    const parsed = identityContextSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}
