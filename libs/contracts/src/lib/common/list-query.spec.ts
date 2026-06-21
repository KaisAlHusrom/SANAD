import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, listQuerySchema } from './list-query.js';

describe('list-query', () => {
  it('applies defaults and coerces strings', () => {
    const parsed = listQuerySchema.parse({});
    expect(parsed.page).toBe(1);
    expect(parsed.pageSize).toBe(DEFAULT_PAGE_SIZE);
    expect(parsed.order).toBe('asc');

    const coerced = listQuerySchema.parse({ page: '3', pageSize: '50' });
    expect(coerced.page).toBe(3);
    expect(coerced.pageSize).toBe(50);
  });

  it('rejects an over-large page size and unknown keys', () => {
    expect(listQuerySchema.safeParse({ pageSize: 999 }).success).toBe(false);
    expect(listQuerySchema.safeParse({ bogus: 1 }).success).toBe(false);
  });
});
