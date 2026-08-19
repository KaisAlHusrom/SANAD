import { describe, expect, it } from 'vitest';
import {
  blockTypeSchema,
  pageStatusSchema,
  sectionTypeSchema,
} from './index.js';
import { serviceCategorySchema } from './service-category.zod.types.js';
import { pageUpsertSchema } from './page-upsert.zod.types.js';
import { blockUpsertSchema } from './block-upsert.zod.types.js';
import { sectionConfigSchema } from './section-config.zod.types.js';
import { sectionUpsertSchema } from './section-upsert.zod.types.js';
import { serviceCreateSchema } from './service-upsert.zod.types.js';
import { serviceListQuerySchema } from './service-list-query.zod.types.js';
import { testimonialCreateSchema } from './testimonial-upsert.zod.types.js';
import { testimonialListQuerySchema } from './testimonial-list-query.zod.types.js';
import { teamMemberCreateSchema } from './team-member-upsert.zod.types.js';
import { teamMemberListQuerySchema } from './team-member-list-query.zod.types.js';
import { portfolioStatusSchema } from './portfolio-status.zod.types.js';
import { portfolioCreateSchema } from './portfolio-upsert.zod.types.js';
import { portfolioListQuerySchema } from './portfolio-list-query.zod.types.js';
import { portfolioCategoryCreateSchema } from './portfolio-category-upsert.zod.types.js';
import { blogPostStatusSchema } from './blog-post-status.zod.types.js';
import { blogPostCreateSchema } from './blog-post-upsert.zod.types.js';
import { blogPostListQuerySchema } from './blog-post-list-query.zod.types.js';
import { blogCategoryCreateSchema } from './blog-category-upsert.zod.types.js';
import { blogTagCreateSchema } from './blog-tag-upsert.zod.types.js';
import { faqCategorySchema } from './faq-category.zod.types.js';
import { faqCreateSchema } from './faq-upsert.zod.types.js';
import { faqListQuerySchema } from './faq-list-query.zod.types.js';
import { menuKeySchema } from './menu-key.zod.types.js';
import { menuCreateSchema } from './menu-upsert.zod.types.js';
import { menuItemCreateSchema } from './menu-item-upsert.zod.types.js';
import { leadCreateRequestSchema } from './lead-create.zod.types.js';
import { leadCreatedEventSchema } from './lead-event.zod.types.js';
import { PHONE_INVALID_MESSAGE_KEY } from '../common/phone/index.js';
import { slugSchema } from './content-slug.zod.types.js';
import {
  CONTENT_PAGE_TREE_GET,
  CONTENT_LEAD_SUBMIT,
  CONTENT_TEAM_MEMBER_LIST,
  CONTENT_TESTIMONIAL_CREATE,
  LEAD_CREATED_EVENT,
} from './message-pattern.js';
import { CONTENT_PERMISSIONS } from './permission.js';

describe('content contracts', () => {
  it('enumerates page/section/block/service kinds', () => {
    expect(pageStatusSchema.options).toEqual(['draft', 'published']);
    expect(sectionTypeSchema.safeParse('hero').success).toBe(true);
    // Phase 5 — faq/team join the marketing-page section types (added with the pg enum, U3).
    expect(sectionTypeSchema.safeParse('faq').success).toBe(true);
    expect(sectionTypeSchema.safeParse('team').success).toBe(true);
    expect(sectionTypeSchema.safeParse('richtext').success).toBe(true);
    expect(sectionTypeSchema.safeParse('bogus').success).toBe(false);
    expect(blockTypeSchema.safeParse('stat').success).toBe(true);
    expect(serviceCategorySchema.options).toEqual(['core', 'support']);
  });

  it('validates a slug and rejects spaces/uppercase', () => {
    expect(slugSchema.safeParse('multi-tenant-saas').success).toBe(true);
    expect(slugSchema.safeParse('Landing Page').success).toBe(false);
    expect(slugSchema.safeParse('UPPER').success).toBe(false);
  });

  it('accepts a page upsert with both-locale title and rejects unknown keys (strict, N7)', () => {
    const parsed = pageUpsertSchema.safeParse({
      slug: 'landing',
      title: { ar: 'الرئيسية', en: 'Home' },
    });
    expect(parsed.success).toBe(true);
    // defaults applied
    if (parsed.success) {
      expect(parsed.data.status).toBe('published');
      expect(parsed.data.sortOrder).toBe(0);
    }
    // missing title (translatable copy required)
    expect(pageUpsertSchema.safeParse({ slug: 'landing' }).success).toBe(false);
    // unknown key rejected (strict)
    expect(
      pageUpsertSchema.safeParse({
        slug: 'landing',
        title: { ar: 'x', en: 'y' },
        nope: 1,
      }).success,
    ).toBe(false);
  });

  it('accepts a block upsert with structured data + optional copy', () => {
    const parsed = blockUpsertSchema.safeParse({
      sectionId: '11111111-1111-1111-1111-111111111111',
      type: 'stat',
      data: { value: 120, suffix: '+' },
      title: { ar: 'مشروع', en: 'Projects' },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.data).toEqual({ value: 120, suffix: '+' });
    }
  });

  it('validates a section collection config (defaults to all/[], strict, picked ids)', () => {
    // defaults applied for an empty config
    const empty = sectionConfigSchema.safeParse({});
    expect(empty.success).toBe(true);
    if (empty.success) {
      expect(empty.data.mode).toBe('all');
      expect(empty.data.ids).toEqual([]);
      expect(empty.data.limit).toBeUndefined();
    }
    // picked with uuid ids + a limit parses
    const picked = sectionConfigSchema.safeParse({
      mode: 'picked',
      limit: 4,
      ids: [
        '11111111-1111-1111-1111-111111111111',
        '22222222-2222-2222-2222-222222222222',
      ],
    });
    expect(picked.success).toBe(true);
    if (picked.success) {
      expect(picked.data.ids).toHaveLength(2);
    }
    // bad mode + non-uuid id + out-of-range limit + unknown key rejected (strict)
    expect(sectionConfigSchema.safeParse({ mode: 'nope' }).success).toBe(false);
    expect(sectionConfigSchema.safeParse({ ids: ['not-a-uuid'] }).success).toBe(
      false,
    );
    expect(sectionConfigSchema.safeParse({ limit: 0 }).success).toBe(false);
    expect(sectionConfigSchema.safeParse({ limit: 51 }).success).toBe(false);
    expect(sectionConfigSchema.safeParse({ bogus: 1 }).success).toBe(false);
  });

  it('accepts a section upsert carrying an optional collection config', () => {
    const parsed = sectionUpsertSchema.safeParse({
      pageId: '11111111-1111-1111-1111-111111111111',
      type: 'services',
      config: { mode: 'all', limit: 8 },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.config?.mode).toBe('all');
      expect(parsed.data.published).toBe(true); // default
    }
    // config omitted is fine (not every section links a collection)
    expect(
      sectionUpsertSchema.safeParse({
        pageId: '11111111-1111-1111-1111-111111111111',
        type: 'hero',
      }).success,
    ).toBe(true);
    // unknown key still rejected (strict, N7)
    expect(
      sectionUpsertSchema.safeParse({
        pageId: '11111111-1111-1111-1111-111111111111',
        type: 'services',
        bogus: 1,
      }).success,
    ).toBe(false);
  });

  it('validates a service create and a category-filtered list query', () => {
    expect(
      serviceCreateSchema.safeParse({
        slug: 'saas',
        category: 'core',
        title: { ar: 'منصّات', en: 'SaaS' },
      }).success,
    ).toBe(true);
    // bad category
    expect(
      serviceCreateSchema.safeParse({
        slug: 'saas',
        category: 'nope',
        title: { ar: 'x', en: 'y' },
      }).success,
    ).toBe(false);
    expect(
      serviceListQuerySchema.safeParse({ category: 'support' }).success,
    ).toBe(true);
    // unknown query key rejected (strict)
    expect(serviceListQuerySchema.safeParse({ bogus: 1 }).success).toBe(false);
  });

  it('validates a testimonial create (quote both-locale, optional rating) + featured filter (N7 boolean)', () => {
    expect(
      testimonialCreateSchema.safeParse({
        authorName: 'Layla',
        quote: { ar: 'فريقٌ يُسنِدك', en: 'A team that backs you' },
      }).success,
    ).toBe(true);
    // default featured=false applied
    const parsed = testimonialCreateSchema.safeParse({
      authorName: 'Layla',
      quote: { ar: 'x', en: 'y' },
    });
    if (parsed.success) {
      expect(parsed.data.featured).toBe(false);
    }
    // rating out of range rejected
    expect(
      testimonialCreateSchema.safeParse({
        authorName: 'L',
        rating: 6,
        quote: { ar: 'x', en: 'y' },
      }).success,
    ).toBe(false);
    // featured query param parses the literal 'true'/'false' (never coerced, N7)
    const ft = testimonialListQuerySchema.safeParse({ featured: 'true' });
    expect(ft.success).toBe(true);
    if (ft.success) {
      expect(ft.data.featured).toBe(true);
    }
    expect(
      testimonialListQuerySchema.safeParse({ featured: 'maybe' }).success,
    ).toBe(false);
    // unknown query key rejected (strict)
    expect(testimonialListQuerySchema.safeParse({ bogus: 1 }).success).toBe(
      false,
    );
  });

  it('validates a team-member create (slug + name/role both-locale, url checks)', () => {
    expect(
      teamMemberCreateSchema.safeParse({
        slug: 'sara-noor',
        name: { ar: 'سارة نور', en: 'Sara Noor' },
        role: { ar: 'مديرة المنتج', en: 'Head of Product' },
        linkedinUrl: 'https://linkedin.com/in/sara',
      }).success,
    ).toBe(true);
    // role required (both-locale)
    expect(
      teamMemberCreateSchema.safeParse({
        slug: 'sara-noor',
        name: { ar: 'سارة', en: 'Sara' },
      }).success,
    ).toBe(false);
    // bad slug + bad url rejected
    expect(
      teamMemberCreateSchema.safeParse({
        slug: 'Sara Noor',
        name: { ar: 'x', en: 'y' },
        role: { ar: 'x', en: 'y' },
      }).success,
    ).toBe(false);
    expect(
      teamMemberCreateSchema.safeParse({
        slug: 'sara',
        name: { ar: 'x', en: 'y' },
        role: { ar: 'x', en: 'y' },
        githubUrl: 'not-a-url',
      }).success,
    ).toBe(false);
    expect(teamMemberListQuerySchema.safeParse({ bogus: 1 }).success).toBe(
      false,
    );
  });

  it('validates a portfolio project (status default draft, embed ids) + status/featured filters', () => {
    expect(portfolioStatusSchema.options).toEqual(['draft', 'published']);
    const parsed = portfolioCreateSchema.safeParse({
      slug: 'tadawul-pay',
      categoryId: '11111111-1111-1111-1111-111111111111',
      clientName: 'Tadawul Pay',
      title: { ar: 'تداول باي', en: 'Tadawul Pay' },
      challenge: { ar: 'التحدي', en: 'The challenge' },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('draft'); // default
      expect(parsed.data.featured).toBe(false);
    }
    // bad projectUrl rejected
    expect(
      portfolioCreateSchema.safeParse({
        slug: 'x',
        title: { ar: 'x', en: 'y' },
        projectUrl: 'not-a-url',
      }).success,
    ).toBe(false);
    // a portfolio category create
    expect(
      portfolioCategoryCreateSchema.safeParse({
        slug: 'fintech',
        name: { ar: 'تقنية مالية', en: 'Fintech' },
      }).success,
    ).toBe(true);
    // list query: status + featured + categoryId filters, strict
    expect(
      portfolioListQuerySchema.safeParse({
        status: 'published',
        featured: 'true',
      }).success,
    ).toBe(true);
    expect(
      portfolioListQuerySchema.safeParse({ status: 'bogus' }).success,
    ).toBe(false);
    expect(portfolioListQuerySchema.safeParse({ bogus: 1 }).success).toBe(
      false,
    );
  });

  it('validates a blog post (status default draft, tagIds M2M, embed ids) + category/tag lookups', () => {
    expect(blogPostStatusSchema.options).toEqual(['draft', 'published']);
    const parsed = blogPostCreateSchema.safeParse({
      slug: 'phase-by-phase',
      categoryId: '11111111-1111-1111-1111-111111111111',
      authorTeamMemberId: '22222222-2222-2222-2222-222222222222',
      tagIds: ['33333333-3333-3333-3333-333333333333'],
      title: { ar: 'مرحلةً تلو الأخرى', en: 'Phase by phase' },
      excerpt: { ar: 'مقتطف', en: 'Excerpt' },
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status).toBe('draft'); // default
      expect(parsed.data.tagIds).toHaveLength(1);
    }
    // tagIds defaults to [] when omitted
    const noTags = blogPostCreateSchema.safeParse({
      slug: 'x',
      title: { ar: 'x', en: 'y' },
    });
    if (noTags.success) {
      expect(noTags.data.tagIds).toEqual([]);
    }
    // non-uuid tag id rejected
    expect(
      blogPostCreateSchema.safeParse({
        slug: 'x',
        title: { ar: 'x', en: 'y' },
        tagIds: ['not-a-uuid'],
      }).success,
    ).toBe(false);
    // category + tag lookups
    expect(
      blogCategoryCreateSchema.safeParse({
        slug: 'engineering',
        name: { ar: 'هندسة', en: 'Engineering' },
      }).success,
    ).toBe(true);
    expect(
      blogTagCreateSchema.safeParse({
        slug: 'nestjs',
        name: { ar: 'نِست', en: 'NestJS' },
      }).success,
    ).toBe(true);
    // list query: status + categoryId filters, strict
    expect(
      blogPostListQuerySchema.safeParse({ status: 'published' }).success,
    ).toBe(true);
    expect(blogPostListQuerySchema.safeParse({ status: 'bogus' }).success).toBe(
      false,
    );
    expect(blogPostListQuerySchema.safeParse({ bogus: 1 }).success).toBe(false);
  });

  it('enumerates faq categories + menu keys (parity with the pg enums)', () => {
    expect(faqCategorySchema.options).toEqual([
      'general',
      'pricing',
      'process',
      'support',
    ]);
    expect(menuKeySchema.options).toEqual(['primary', 'footer']);
  });

  it('validates an faq create (question/answer both-locale) + category-filtered list', () => {
    expect(
      faqCreateSchema.safeParse({
        question: {
          ar: 'كم يستغرق المشروع؟',
          en: 'How long does a project take?',
        },
        answer: { ar: 'حسب النطاق.', en: 'It depends on scope.' },
      }).success,
    ).toBe(true);
    // answer required (both-locale)
    expect(
      faqCreateSchema.safeParse({
        question: { ar: 'x', en: 'y' },
      }).success,
    ).toBe(false);
    expect(faqListQuerySchema.safeParse({ category: 'pricing' }).success).toBe(
      true,
    );
    expect(faqListQuerySchema.safeParse({ category: 'bogus' }).success).toBe(
      false,
    );
    expect(faqListQuerySchema.safeParse({ bogus: 1 }).success).toBe(false);
  });

  it('validates a menu create (key enum) + a menu item (label both-locale, nesting)', () => {
    expect(menuCreateSchema.safeParse({ key: 'primary' }).success).toBe(true);
    expect(menuCreateSchema.safeParse({ key: 'sidebar' }).success).toBe(false);
    const item = menuItemCreateSchema.safeParse({
      menuId: '11111111-1111-1111-1111-111111111111',
      url: '/services',
      label: { ar: 'خدماتنا', en: 'Services' },
    });
    expect(item.success).toBe(true);
    if (item.success) {
      expect(item.data.sortOrder).toBe(0); // default
    }
    // url required + unknown key rejected (strict)
    expect(
      menuItemCreateSchema.safeParse({
        menuId: '11111111-1111-1111-1111-111111111111',
        label: { ar: 'x', en: 'y' },
      }).success,
    ).toBe(false);
    expect(
      menuItemCreateSchema.safeParse({
        menuId: '11111111-1111-1111-1111-111111111111',
        url: '/x',
        label: { ar: 'x', en: 'y' },
        bogus: 1,
      }).success,
    ).toBe(false);
  });

  it('validates a public lead submission, defaults source+locale, rejects bad email/extra keys', () => {
    const parsed = leadCreateRequestSchema.safeParse({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966 50 123 4567',
      message: 'We need an LMS.',
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.source).toBe('contact');
      expect(parsed.data.locale).toBe('ar');
      // Stored normalized, whatever the visitor typed (P8.10.B1).
      expect(parsed.data.phone).toBe('+966501234567');
    }
    expect(
      leadCreateRequestSchema.safeParse({
        name: 'x',
        email: 'not-an-email',
        phone: '+966501234567',
        message: 'hi',
      }).success,
    ).toBe(false);
    expect(
      leadCreateRequestSchema.safeParse({
        name: 'x',
        email: 'a@b.co',
        phone: '+966501234567',
        message: 'hi',
        spam: true,
      }).success,
    ).toBe(false);
  });

  it('requires a callable phone number on every submission (P8.10.B1)', () => {
    const base = { name: 'Layla', email: 'layla@example.com', message: 'Hi.' };
    expect(leadCreateRequestSchema.safeParse(base).success).toBe(false);
    expect(
      leadCreateRequestSchema.safeParse({ ...base, phone: '0501234567' })
        .success,
    ).toBe(false);
    const bad = leadCreateRequestSchema.safeParse({ ...base, phone: 'nope' });
    expect(bad.success).toBe(false);
    if (!bad.success) {
      expect(bad.error.issues[0]?.path).toEqual(['phone']);
      expect(bad.error.issues[0]?.message).toBe(PHONE_INVALID_MESSAGE_KEY);
    }
  });

  it('carries the phone on lead.created so the team email can render it', () => {
    const event = {
      id: '11111111-1111-4111-8111-111111111111',
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      company: null,
      projectType: null,
      message: 'Hi.',
      source: 'contact',
      locale: 'ar',
      occurredAt: '2026-08-19T00:00:00.000Z',
    };
    expect(leadCreatedEventSchema.safeParse(event).success).toBe(true);
    // Nullable, so an event queued across the deploy still parses (U15).
    expect(
      leadCreatedEventSchema.safeParse({ ...event, phone: null }).success,
    ).toBe(true);
  });

  it('exposes stable permissions, patterns, and the lead.created event name', () => {
    expect(CONTENT_PERMISSIONS.read).toBe('content.read');
    expect(CONTENT_PERMISSIONS.manage).toBe('content.manage');
    expect(CONTENT_PAGE_TREE_GET).toBe('content.page.tree');
    expect(CONTENT_LEAD_SUBMIT).toBe('content.lead.submit');
    expect(CONTENT_TESTIMONIAL_CREATE).toBe('content.testimonial.create');
    expect(CONTENT_TEAM_MEMBER_LIST).toBe('content.team-member.list');
    expect(LEAD_CREATED_EVENT).toBe('lead.created');
  });
});
