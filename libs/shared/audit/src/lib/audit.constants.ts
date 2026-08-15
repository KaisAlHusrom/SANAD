import type { AuditActor } from './audit-entry.types.js';

/**
 * A namespaced, lower-case `<entity>.<verb>` action (`settings.updated`, `envelope.signed`).
 * Enforced because the trail's whole value is being queryable years later: free-form prose
 * ("Updated settings") makes "show me every signature event" impossible to write.
 */
export const ACTION_PATTERN = /^[a-z0-9-]+(\.[a-z0-9-]+)+$/;

/** The actor for work with no caller — a seeder, a scheduled sweep, a relay. */
export const SYSTEM_ACTOR: AuditActor = {
  userId: null,
  role: null,
  type: 'system',
};

/** Metadata key the audit interceptor reads `@Audited()` from. */
export const AUDITED_METADATA_KEY = 'sanad:audited';
