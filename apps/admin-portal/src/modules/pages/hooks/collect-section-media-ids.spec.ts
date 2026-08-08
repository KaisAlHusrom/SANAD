import type {
  BlockNode,
  PortfolioProjectItem,
  SectionNode,
} from '@sanad/contracts';
import { describe, expect, it } from 'vitest';
import { collectSectionMediaIds } from './collect-section-media-ids';

const loc = { ar: '', en: '' };

function block(imageMediaId: string | null): BlockNode {
  return {
    id: `b-${imageMediaId ?? 'none'}`,
    type: 'image',
    sortOrder: 0,
    data: {},
    imageMediaId,
    title: loc,
    body: loc,
  };
}

function project(
  id: string,
  coverMediaId: string | null,
): PortfolioProjectItem {
  return {
    id,
    slug: id,
    category: null,
    coverMediaId,
    clientName: null,
    projectUrl: null,
    status: 'published',
    publishedAt: null,
    featured: false,
    sortOrder: 0,
    title: loc,
    summary: loc,
    challenge: loc,
    solution: loc,
    result: loc,
    createdAt: '',
    updatedAt: '',
  };
}

function section(overrides: Partial<SectionNode> = {}): SectionNode {
  return {
    id: 's',
    type: 'work',
    sortOrder: 0,
    published: true,
    eyebrow: loc,
    title: loc,
    subtitle: loc,
    blocks: [],
    config: null,
    collection: null,
    ...overrides,
  };
}

describe('collectSectionMediaIds', () => {
  it('collects image-block ids + hydrated portfolio cover ids, deduped', () => {
    const sec = section({
      blocks: [block('m-block'), block(null)],
      collection: {
        collection: 'portfolio',
        items: [
          project('p1', 'm-cover-1'),
          project('p2', null),
          project('p3', 'm-block'),
        ],
      },
    });
    // m-block appears in a block AND a cover → deduped; nulls dropped
    expect(collectSectionMediaIds(sec).sort()).toEqual([
      'm-block',
      'm-cover-1',
    ]);
  });

  it('returns [] for a section with no media (no blocks, no collection)', () => {
    expect(collectSectionMediaIds(section())).toEqual([]);
  });

  it('collects testimonial avatar ids (avatarMediaId, not coverMediaId), nulls dropped', () => {
    const testimonial = (id: string, avatarMediaId: string | null) => ({
      id,
      authorName: 'A',
      companyName: null,
      avatarMediaId,
      rating: 5,
      featured: false,
      sortOrder: 0,
      quote: loc,
      authorRole: loc,
      companyDescriptor: loc,
      createdAt: '',
      updatedAt: '',
    });
    const sec = section({
      type: 'testimonials',
      collection: {
        collection: 'testimonials',
        items: [testimonial('t1', 'm-avatar'), testimonial('t2', null)],
      },
    });
    // the author photo resolves so the admin preview shows it (preview===live)
    expect(collectSectionMediaIds(sec)).toEqual(['m-avatar']);
  });

  it('collects team-member avatar ids (avatarMediaId), nulls dropped (Phase 5)', () => {
    const member = (id: string, avatarMediaId: string | null) => ({
      id,
      slug: id,
      avatarMediaId,
      email: null,
      linkedinUrl: null,
      githubUrl: null,
      featured: false,
      sortOrder: 0,
      name: loc,
      role: loc,
      bio: loc,
      createdAt: '',
      updatedAt: '',
    });
    const sec = section({
      type: 'team',
      collection: {
        collection: 'team',
        items: [member('u1', 'm-face'), member('u2', null)],
      },
    });
    expect(collectSectionMediaIds(sec)).toEqual(['m-face']);
  });
});
