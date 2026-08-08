import { describe, expect, it } from 'vitest';
import type { PublicMediaRef, SectionNode } from '@sanad/contracts';
import { collectImageIds } from './collect-image-ids';
import { makeImageResolver } from './resolve-image-url';

const EMPTY = { ar: '', en: '' };

function block(
  type: SectionNode['blocks'][number]['type'],
  imageMediaId: string | null,
): SectionNode['blocks'][number] {
  return {
    id: `b-${imageMediaId ?? type}`,
    type,
    sortOrder: 0,
    data: {},
    imageMediaId,
    title: EMPTY,
    body: EMPTY,
  };
}

function section(blocks: SectionNode['blocks']): SectionNode {
  return {
    id: 's',
    type: 'richtext',
    sortOrder: 0,
    published: true,
    eyebrow: EMPTY,
    title: EMPTY,
    subtitle: EMPTY,
    blocks,
  };
}

describe('collectImageIds', () => {
  it('collects distinct image-block ids, ignoring non-image + null', () => {
    const sections = [
      section([block('image', 'a'), block('text', null), block('image', 'b')]),
      section([block('image', 'a'), block('cta', null), block('image', null)]),
    ];
    expect(collectImageIds(sections)).toEqual(['a', 'b']);
  });

  it('returns [] for a tree with no images', () => {
    expect(collectImageIds([section([block('text', null)])])).toEqual([]);
  });

  it('returns [] for no sections', () => {
    expect(collectImageIds([])).toEqual([]);
  });
});

describe('makeImageResolver', () => {
  const ref: PublicMediaRef = {
    id: 'a',
    url: 'https://cdn.test/a.png',
    alt: EMPTY,
    width: 10,
    height: 20,
  };

  it('resolves a known id to its url', () => {
    const resolve = makeImageResolver(new Map([['a', ref]]));
    expect(resolve('a')).toBe('https://cdn.test/a.png');
  });

  it('returns "" for an unresolved id (placeholder fallback)', () => {
    const resolve = makeImageResolver(new Map([['a', ref]]));
    expect(resolve('missing')).toBe('');
    expect(makeImageResolver(new Map())('a')).toBe('');
  });
});
