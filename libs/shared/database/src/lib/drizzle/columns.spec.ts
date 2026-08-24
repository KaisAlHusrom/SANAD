import { describe, expect, it } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { pgTable } from 'drizzle-orm/pg-core';
import { jsonb } from 'drizzle-orm/pg-core';
import { jsonbScalar, pk, softDelete, timestamps } from './columns.js';

const sample = pgTable('sample', {
  id: pk(),
  ...timestamps(),
  ...softDelete(),
  value: jsonbScalar('value'),
});

describe('drizzle column helpers', () => {
  const cols = getTableColumns(sample);

  it('pk is a primary uuid named id', () => {
    expect(cols.id.name).toBe('id');
    expect(cols.id.primary).toBe(true);
    expect(cols.id.columnType).toBe('PgUUID');
  });

  it('timestamps map to snake_case, non-null columns', () => {
    expect(cols.createdAt.name).toBe('created_at');
    expect(cols.updatedAt.name).toBe('updated_at');
    expect(cols.createdAt.notNull).toBe(true);
  });

  it('soft-delete is a nullable deleted_at', () => {
    expect(cols.deletedAt.name).toBe('deleted_at');
    expect(cols.deletedAt.notNull).toBe(false);
  });
});

/**
 * The trap this column exists to close (found at runtime in P8.23.A1, on a **Meta pixel id**).
 *
 * node-postgres already parses a `jsonb` column, so drizzle's own `jsonb()` receives an
 * ALREADY-PARSED value — and parses it a second time. For a stored JSON *string* the second
 * parse silently changes the type whenever the text happens to be valid JSON on its own:
 * `"123456789012345"` comes back a **number**, `"true"` a **boolean**, `'{"a":1}'` an
 * **object**. It throws for anything else and is swallowed, so most values look fine and the
 * corruption only shows up for the ones that don't. Nothing logs, nothing fails.
 */
describe('jsonbScalar — the double-parse trap', () => {
  // Read the BUILT columns off real tables: `.build()` is internal and untyped, whereas this
  // is the same object drizzle actually uses to map a row.
  const stockTable = pgTable('stock', { value: jsonb('value') });
  const built = getTableColumns(sample).value;
  const stock = getTableColumns(stockTable).value;

  it.each([
    ['an all-digit vendor id', '123456789012345'],
    ['the literal text "true"', 'true'],
    ['text that happens to be JSON', '{"a":1}'],
    ['an ordinary id', 'G-ABCDE12345'],
    ['a leading-zero code', '0123456'],
  ])(
    'returns %s unchanged, as the string it was stored as',
    (_label, value) => {
      const out = built.mapFromDriverValue(value);
      expect(typeof out).toBe('string');
      expect(out).toBe(value);
    },
  );

  it('passes numbers and booleans through untouched', () => {
    expect(built.mapFromDriverValue(42)).toBe(42);
    expect(built.mapFromDriverValue(true)).toBe(true);
    expect(built.mapFromDriverValue(null)).toBeNull();
  });

  it('still serializes on the way IN, so the column stays real jsonb', () => {
    expect(built.mapToDriverValue('123456789012345')).toBe('"123456789012345"');
    expect(built.mapToDriverValue(42)).toBe('42');
  });

  // Pins the actual defect rather than trusting the description of it: if a future drizzle
  // stops double-parsing, this fails and the workaround can be retired deliberately.
  it('drizzle’s stock jsonb() really does corrupt these — this is not a theoretical fix', () => {
    expect(stock.mapFromDriverValue('123456789012345')).toBe(123456789012345);
    expect(stock.mapFromDriverValue('true')).toBe(true);
  });
});
