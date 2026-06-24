import {
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  isNull,
  like,
  lt,
  lte,
  ne,
  notInArray,
  type Column,
  type SQL,
} from 'drizzle-orm';

export type WhereOp =
  | 'eq'
  | 'neq'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'like'
  | 'ilike'
  | 'contains'
  | 'in'
  | 'notIn'
  | 'isNull'
  | 'isNotNull';

/** Build a Drizzle SQL condition from a column, an operator, and a value. */
export function buildCondition(
  column: Column,
  op: WhereOp,
  value: unknown,
): SQL {
  switch (op) {
    case 'eq':
      return eq(column, value);
    case 'neq':
      return ne(column, value);
    case 'gt':
      return gt(column, value);
    case 'gte':
      return gte(column, value);
    case 'lt':
      return lt(column, value);
    case 'lte':
      return lte(column, value);
    case 'like':
      return like(column, String(value));
    case 'ilike':
      return ilike(column, String(value));
    case 'contains':
      return ilike(column, `%${String(value)}%`);
    case 'in':
      return inArray(column, toArray(value));
    case 'notIn':
      return notInArray(column, toArray(value));
    case 'isNull':
      return isNull(column);
    case 'isNotNull':
      return isNotNull(column);
  }
}

function toArray(value: unknown): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(
      `Operator expected an array value but received: ${typeof value}`,
    );
  }
  return value;
}
