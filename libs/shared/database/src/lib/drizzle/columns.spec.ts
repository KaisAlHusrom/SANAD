import { describe, expect, it } from 'vitest';
import { getTableColumns } from 'drizzle-orm';
import { pgTable } from 'drizzle-orm/pg-core';
import { pk, softDelete, timestamps } from './columns.js';

const sample = pgTable('sample', {
  id: pk(),
  ...timestamps(),
  ...softDelete(),
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
