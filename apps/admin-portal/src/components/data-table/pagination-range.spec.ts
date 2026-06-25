import { describe, expect, it } from 'vitest';
import { buildPaginationRange } from './pagination-range';

describe('buildPaginationRange', () => {
  it('returns an empty array for no pages', () => {
    expect(buildPaginationRange(1, 0)).toEqual([]);
  });

  it('lists every page when they fit without ellipsis', () => {
    expect(buildPaginationRange(1, 5)).toEqual([1, 2, 3, 4, 5]);
    expect(buildPaginationRange(4, 7)).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('shows a trailing ellipsis near the start', () => {
    expect(buildPaginationRange(1, 10)).toEqual([
      1,
      2,
      3,
      4,
      5,
      'ellipsis',
      10,
    ]);
  });

  it('shows a leading ellipsis near the end', () => {
    expect(buildPaginationRange(10, 10)).toEqual([
      1,
      'ellipsis',
      6,
      7,
      8,
      9,
      10,
    ]);
  });

  it('shows both ellipses in the middle', () => {
    expect(buildPaginationRange(5, 10)).toEqual([
      1,
      'ellipsis',
      4,
      5,
      6,
      'ellipsis',
      10,
    ]);
  });

  it('always includes the first and last page', () => {
    const range = buildPaginationRange(6, 20);
    expect(range[0]).toBe(1);
    expect(range[range.length - 1]).toBe(20);
  });
});
