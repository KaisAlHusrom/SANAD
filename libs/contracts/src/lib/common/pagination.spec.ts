import { describe, expect, it } from 'vitest';
import { buildPaginationMeta, paginationMetaSchema } from './pagination.js';

describe('pagination', () => {
  it('computes total pages by ceiling', () => {
    const meta = buildPaginationMeta(45, 1, 20);
    expect(meta.totalPages).toBe(3);
    expect(paginationMetaSchema.safeParse(meta).success).toBe(true);
  });

  it('handles an empty result set', () => {
    expect(buildPaginationMeta(0, 1, 20).totalPages).toBe(0);
  });
});
