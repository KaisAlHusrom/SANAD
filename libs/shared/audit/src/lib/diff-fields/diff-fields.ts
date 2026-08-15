/** The changed slice of a before/after pair. */
export interface FieldDiff {
  before: unknown;
  after: unknown;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Order-insensitive structural comparison — a re-serialised object is not a change. */
function sameValue(left: unknown, right: unknown): boolean {
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value: unknown): string {
  if (!isPlainObject(value)) {
    return JSON.stringify(value) ?? 'undefined';
  }
  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`);
  return `{${entries.join(',')}}`;
}

/**
 * Reduce a before/after pair to the fields that MOVED.
 *
 * Storing whole records on both sides makes a trail nobody reads: the change is buried in a wall
 * of unchanged fields, and every row costs a multiple of what it needs. An added key appears as
 * `before: null`, a removed one as `after: null`, so a reader can tell creation from mutation
 * from deletion without a fourth column. A non-object side (a create, a delete, a scalar) is
 * kept whole — there is nothing to diff against.
 */
export function diffFields(before: unknown, after: unknown): FieldDiff {
  if (!isPlainObject(before) || !isPlainObject(after)) {
    return { before: before ?? null, after: after ?? null };
  }
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const changedBefore: Record<string, unknown> = {};
  const changedAfter: Record<string, unknown> = {};
  for (const key of keys) {
    if (!sameValue(before[key], after[key])) {
      changedBefore[key] = before[key] ?? null;
      changedAfter[key] = after[key] ?? null;
    }
  }
  return { before: changedBefore, after: changedAfter };
}
