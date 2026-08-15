import {
  MAX_REDACT_DEPTH,
  REDACTED,
  SECRET_KEY_PATTERNS,
} from '../redact.constants.js';

export { REDACTED };

function isSecretKey(key: string): boolean {
  const normalized = key.toLowerCase().replace(/[-\s]/g, '');
  return SECRET_KEY_PATTERNS.some((pattern) =>
    normalized.includes(pattern.replace(/_/g, '')),
  );
}

/**
 * Mask secret-looking fields before a value is written to the trail.
 *
 * The audit row is the one place in the platform that deliberately stores a copy of whatever a
 * write contained — so it is also the easiest place for a credential to end up in plain text
 * (N13 keeps them encrypted everywhere else, and that effort is wasted if the change log
 * prints them). Cycles and runaway depth are handled because this runs on the request path: a
 * trail that can hang or blow the stack costs the client their write.
 */
export function redact(
  value: unknown,
  depth = 0,
  seen = new WeakSet<object>(),
): unknown {
  if (value === null || typeof value !== 'object') {
    return value;
  }
  if (depth >= MAX_REDACT_DEPTH || seen.has(value)) {
    return REDACTED;
  }
  seen.add(value);

  if (Array.isArray(value)) {
    return value.map((item) => redact(item, depth + 1, seen));
  }
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      isSecretKey(key) ? REDACTED : redact(item, depth + 1, seen),
    ]),
  );
}
