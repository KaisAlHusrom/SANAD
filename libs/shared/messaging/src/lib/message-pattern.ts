/**
 * Builds the canonical message-pattern string for a request/reply call (reads,
 * MS2): `<service>.<resource>.<action>`. Used by `@MessagePattern` on the
 * service side and the gateway client on the caller side.
 */
export function requestPattern(
  service: string,
  resource: string,
  action: string,
): string {
  return `${service}.${resource}.${action}`;
}

/** The routing name for an emitted event (writes, MS3): `<entity>.<event>`. */
export function eventPattern(entity: string, event: string): string {
  return `${entity}.${event}`;
}
