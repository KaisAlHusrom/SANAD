import { describe, expect, it } from 'vitest';
import { reorderRows } from './data-table-reorder';

interface Row {
  id: string;
}
const rows: Row[] = [{ id: 'a' }, { id: 'b' }, { id: 'c' }];
const getId = (row: Row): string => row.id;

describe('reorderRows', () => {
  it('moves the active row to the over position', () => {
    expect(reorderRows(rows, 'a', 'c', getId)?.map(getId)).toEqual([
      'b',
      'c',
      'a',
    ]);
    expect(reorderRows(rows, 'c', 'a', getId)?.map(getId)).toEqual([
      'c',
      'a',
      'b',
    ]);
  });

  it('returns null when nothing changes', () => {
    expect(reorderRows(rows, 'a', 'a', getId)).toBeNull();
    expect(reorderRows(rows, 'a', 'missing', getId)).toBeNull();
    expect(reorderRows(rows, 'missing', 'b', getId)).toBeNull();
  });

  it('does not mutate the input array', () => {
    reorderRows(rows, 'a', 'c', getId);
    expect(rows.map(getId)).toEqual(['a', 'b', 'c']);
  });
});
