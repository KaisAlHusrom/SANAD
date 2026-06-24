import type { Cast } from './model-config.js';

/**
 * Coerce a raw column value according to its declared cast. Null/undefined pass through
 * untouched. (SANAD stores + reads UTC; the `date` cast normalizes to an ISO string —
 * active-timezone conversion is deferred until `DateTimeService` gains timezone support.)
 */
export function applyCast(value: unknown, cast: Cast): unknown {
  if (value === null || value === undefined) {
    return value;
  }

  switch (cast) {
    case 'number':
      return typeof value === 'number' ? value : Number(value);
    case 'boolean':
      return typeof value === 'boolean' ? value : Boolean(value);
    case 'string':
      return typeof value === 'string' ? value : String(value);
    case 'json':
      return typeof value === 'string' ? JSON.parse(value) : value;
    case 'date':
      return value instanceof Date ? value.toISOString() : value;
  }
}
