import type { SectionNode } from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import {
  buildConfigUpsertBody,
  collectionMetaFor,
  configFromControls,
} from './use-section-config';

const servicesSection: SectionNode = {
  id: 's1',
  type: 'services',
  sortOrder: 3,
  published: true,
  eyebrow: { ar: 'الأنظمة', en: 'SYSTEMS' },
  title: { ar: 'قدرة كاملة', en: 'Full capability' },
  subtitle: { ar: 'فريق واحد', en: 'One team' },
  blocks: [],
  config: { mode: 'all', limit: 4, ids: [] },
  collection: null,
};

describe('collectionMetaFor', () => {
  it('returns meta for collection-backed types + undefined otherwise', () => {
    const services = collectionMetaFor('services');
    expect(services?.manageTo).toBe('/content/services');
    expect(services?.modes).toEqual(['all', 'picked']);
    // trust links the portfolio collection, `all`-only (breadth of domains, no picked list)
    const trust = collectionMetaFor('trust');
    expect(trust?.manageTo).toBe('/content/portfolio');
    expect(trust?.modes).toEqual(['all']);
    // work is the curated case-study orbit — featured/picked/all over the portfolio collection
    const work = collectionMetaFor('work');
    expect(work?.manageTo).toBe('/content/portfolio');
    expect(work?.modes).toEqual(['featured', 'picked', 'all']);
    expect(work?.pickedCollection).toBe('portfolio');
    expect(services?.pickedCollection).toBe('services');
    // testimonials — featured/picked/all over the testimonials collection (has a `featured` flag)
    const testimonials = collectionMetaFor('testimonials');
    expect(testimonials?.manageTo).toBe('/content/testimonials');
    expect(testimonials?.modes).toEqual(['featured', 'picked', 'all']);
    expect(testimonials?.pickedCollection).toBe('testimonials');
    // blog — picked/all over the blog collection (no `featured` flag → no featured mode)
    const blog = collectionMetaFor('blog');
    expect(blog?.manageTo).toBe('/content/blog');
    expect(blog?.modes).toEqual(['picked', 'all']);
    expect(blog?.pickedCollection).toBe('blog');
    expect(collectionMetaFor('hero')).toBeUndefined();
    expect(collectionMetaFor('richtext')).toBeUndefined();
  });
});

describe('configFromControls', () => {
  it('keeps a valid 1–50 limit, drops blank/out-of-range, and only keeps ids for picked', () => {
    expect(configFromControls('all', '8', [])).toEqual({
      mode: 'all',
      limit: 8,
      ids: [],
    });
    // blank limit → omitted
    expect(configFromControls('all', '', [])).toEqual({ mode: 'all', ids: [] });
    // out of range → omitted
    expect(configFromControls('all', '0', [])).toEqual({
      mode: 'all',
      ids: [],
    });
    expect(configFromControls('all', '99', [])).toEqual({
      mode: 'all',
      ids: [],
    });
    // ids kept only for picked; dropped for non-picked
    expect(configFromControls('picked', '', ['a', 'b'])).toEqual({
      mode: 'picked',
      ids: ['a', 'b'],
    });
    expect(configFromControls('all', '', ['a', 'b'])).toEqual({
      mode: 'all',
      ids: [],
    });
  });
});

describe('buildConfigUpsertBody', () => {
  it('carries the new config while preserving the section copy + published + sortOrder', () => {
    const body = buildConfigUpsertBody('p1', servicesSection, {
      mode: 'picked',
      ids: ['svc-1', 'svc-2'],
    });
    expect(body).toEqual({
      id: 's1',
      pageId: 'p1',
      type: 'services',
      sortOrder: 3,
      published: true,
      eyebrow: { ar: 'الأنظمة', en: 'SYSTEMS' },
      title: { ar: 'قدرة كاملة', en: 'Full capability' },
      subtitle: { ar: 'فريق واحد', en: 'One team' },
      config: { mode: 'picked', ids: ['svc-1', 'svc-2'] },
    });
  });
});
