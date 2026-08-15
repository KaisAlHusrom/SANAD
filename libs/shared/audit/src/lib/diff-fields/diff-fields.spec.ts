import { describe, expect, it } from 'vitest';
import { diffFields } from './diff-fields.js';

describe('diffFields', () => {
  it('keeps only the keys that actually changed', () => {
    expect(
      diffFields(
        { name: 'Sanad', colour: 'blue', locale: 'ar' },
        { name: 'Sanad', colour: 'green', locale: 'ar' },
      ),
    ).toEqual({ before: { colour: 'blue' }, after: { colour: 'green' } });
  });

  it('records an ADDED key as before-undefined', () => {
    expect(diffFields({ a: 1 }, { a: 1, b: 2 })).toEqual({
      before: { b: null },
      after: { b: 2 },
    });
  });

  it('records a REMOVED key as after-null, so a deletion is visible', () => {
    expect(diffFields({ a: 1, b: 2 }, { a: 1 })).toEqual({
      before: { b: 2 },
      after: { b: null },
    });
  });

  it('compares nested values structurally — a reordered object is NOT a change', () => {
    expect(
      diffFields(
        { brand: { ar: 'سند', en: 'Sanad' } },
        { brand: { en: 'Sanad', ar: 'سند' } },
      ),
    ).toEqual({ before: {}, after: {} });
  });

  it('detects a nested change and keeps the whole nested value on both sides', () => {
    expect(
      diffFields(
        { brand: { ar: 'سند', en: 'Sanad' } },
        { brand: { ar: 'سند', en: 'Sanad Tech' } },
      ),
    ).toEqual({
      before: { brand: { ar: 'سند', en: 'Sanad' } },
      after: { brand: { ar: 'سند', en: 'Sanad Tech' } },
    });
  });

  it('treats a whole-object create/delete honestly', () => {
    expect(diffFields(null, { a: 1 })).toEqual({
      before: null,
      after: { a: 1 },
    });
    expect(diffFields({ a: 1 }, null)).toEqual({
      before: { a: 1 },
      after: null,
    });
    expect(diffFields(null, null)).toEqual({ before: null, after: null });
  });

  it('falls back to whole values when a side is not an object', () => {
    expect(diffFields('old', 'new')).toEqual({ before: 'old', after: 'new' });
  });
});
