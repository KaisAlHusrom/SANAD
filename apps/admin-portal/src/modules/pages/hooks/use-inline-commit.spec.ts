import type { BlockNode, SectionNode } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { buildInlineUpsert, buildPageInlineUpsert } from './use-inline-commit';

const statBlock: BlockNode = {
  id: 'b1',
  type: 'stat',
  sortOrder: 0,
  data: { value: 120, suffix: '+' },
  imageMediaId: null,
  title: { ar: 'مشاريع', en: 'projects' },
  body: { ar: '', en: '' },
};

const section: SectionNode = {
  id: 's1',
  type: 'stats',
  sortOrder: 2,
  published: true,
  eyebrow: { ar: 'بالأرقام', en: 'TELEMETRY' },
  title: { ar: 'أرقام', en: 'Numbers' },
  subtitle: { ar: '', en: '' },
  blocks: [statBlock],
  config: null,
  collection: null,
};

describe('buildInlineUpsert', () => {
  it('builds a section upsert that overrides ONLY the edited locale + field, preserving the rest', () => {
    const upsert = buildInlineUpsert(
      'p1',
      section,
      {
        kind: 'section',
        sectionId: 's1',
        field: 'title',
      },
      'Our numbers',
      'en',
    );

    expect(upsert).toEqual({
      kind: 'section',
      body: {
        id: 's1',
        pageId: 'p1',
        type: 'stats',
        sortOrder: 2,
        published: true,
        eyebrow: { ar: 'بالأرقام', en: 'TELEMETRY' },
        // en overridden, ar preserved (Arabic-first, U8)
        title: { ar: 'أرقام', en: 'Our numbers' },
        subtitle: { ar: '', en: '' },
      },
    });
  });

  it('builds a block title upsert preserving the other locale + the block data + image', () => {
    const upsert = buildInlineUpsert(
      'p1',
      section,
      {
        kind: 'block',
        sectionId: 's1',
        blockId: 'b1',
        field: 'title',
      },
      'عملاء',
      'ar',
    );

    expect(upsert?.kind).toBe('block');
    if (upsert?.kind !== 'block') throw new Error('expected block');
    expect(upsert.body.title).toEqual({ ar: 'عملاء', en: 'projects' });
    expect(upsert.body.data).toEqual({ value: 120, suffix: '+' });
    expect(upsert.body.id).toBe('b1');
    expect(upsert.body.sectionId).toBe('s1');
  });

  it('coerces a numeric block-data value and merges into the existing data bag', () => {
    const upsert = buildInlineUpsert(
      'p1',
      section,
      {
        kind: 'block-data',
        sectionId: 's1',
        blockId: 'b1',
        key: 'value',
      },
      '200',
      'en',
    );

    if (upsert?.kind !== 'block') throw new Error('expected block');
    // stored as a NUMBER (not the string '200'), suffix preserved
    expect(upsert.body.data).toEqual({ value: 200, suffix: '+' });
  });

  it('keeps a non-numeric block-data value as a string', () => {
    const upsert = buildInlineUpsert(
      'p1',
      section,
      {
        kind: 'block-data',
        sectionId: 's1',
        blockId: 'b1',
        key: 'suffix',
      },
      '%',
      'en',
    );

    if (upsert?.kind !== 'block') throw new Error('expected block');
    expect(upsert.body.data).toEqual({ value: 120, suffix: '%' });
  });

  it('sets a block image (block-image) to the picked media id, preserving the other fields', () => {
    const upsert = buildInlineUpsert(
      'p1',
      section,
      {
        kind: 'block-image',
        sectionId: 's1',
        blockId: 'b1',
      },
      'media-42',
      'en',
    );

    if (upsert?.kind !== 'block') throw new Error('expected block');
    expect(upsert.body.imageMediaId).toBe('media-42');
    // the rest of the block is preserved untouched
    expect(upsert.body.data).toEqual({ value: 120, suffix: '+' });
    expect(upsert.body.title).toEqual({ ar: 'مشاريع', en: 'projects' });
  });

  it('clears a block image when the picked value is empty (block-image → null)', () => {
    const upsert = buildInlineUpsert(
      'p1',
      section,
      {
        kind: 'block-image',
        sectionId: 's1',
        blockId: 'b1',
      },
      '',
      'en',
    );

    if (upsert?.kind !== 'block') throw new Error('expected block');
    expect(upsert.body.imageMediaId).toBeNull();
  });

  it('returns null for a block edit whose block no longer exists (stale edit)', () => {
    expect(
      buildInlineUpsert(
        'p1',
        section,
        {
          kind: 'block',
          sectionId: 's1',
          blockId: 'gone',
          field: 'title',
        },
        'x',
        'en',
      ),
    ).toBeNull();
  });
});

const otherSection: SectionNode = {
  id: 's2',
  type: 'hero',
  sortOrder: 0,
  published: true,
  eyebrow: { ar: '', en: '' },
  title: { ar: 'مرحبا', en: 'Hello' },
  subtitle: { ar: '', en: '' },
  blocks: [],
  config: null,
  collection: null,
};

describe('buildPageInlineUpsert (page-scope canvas)', () => {
  const sections = [otherSection, section];

  it('resolves the target section from the tree by the path sectionId and edits ONLY it', () => {
    const upsert = buildPageInlineUpsert(
      'p1',
      sections,
      { kind: 'section', sectionId: 's1', field: 'title' },
      'Our numbers',
      'en',
    );
    if (upsert?.kind !== 'section') throw new Error('expected section');
    expect(upsert.body.id).toBe('s1');
    // s1's ar preserved, en overridden; the sibling s2 is not referenced at all
    expect(upsert.body.title).toEqual({ ar: 'أرقام', en: 'Our numbers' });
  });

  it('routes a block edit to the section that owns the block', () => {
    const upsert = buildPageInlineUpsert(
      'p1',
      sections,
      { kind: 'block', sectionId: 's1', blockId: 'b1', field: 'title' },
      'عملاء',
      'ar',
    );
    if (upsert?.kind !== 'block') throw new Error('expected block');
    expect(upsert.body.sectionId).toBe('s1');
    expect(upsert.body.title).toEqual({ ar: 'عملاء', en: 'projects' });
  });

  it('returns null when the path targets a section no longer in the tree', () => {
    expect(
      buildPageInlineUpsert(
        'p1',
        sections,
        { kind: 'section', sectionId: 'gone', field: 'title' },
        'x',
        'en',
      ),
    ).toBeNull();
  });
});
