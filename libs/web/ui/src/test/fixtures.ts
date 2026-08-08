import type {
  BlockNode,
  BlockType,
  BlogPostItem,
  FaqItem,
  LocalizedText,
  PortfolioProjectItem,
  SectionNode,
  ServiceItem,
  TeamMemberItem,
  TestimonialItem,
} from '@sanad/contracts';

/** A `LocalizedText` with the given values (blank by default — exercises F7 fallback). */
export const loc = (ar = '', en = ''): LocalizedText => ({ ar, en });

let seq = 0;
const id = () => `id-${(seq += 1)}`;

/** Build a `ServiceItem` for a hydrated `services` collection fixture. */
export function serviceItem(overrides: Partial<ServiceItem> = {}): ServiceItem {
  return {
    id: id(),
    slug: 'saas',
    iconKey: null,
    category: 'core',
    coverMediaId: null,
    sortOrder: 0,
    title: loc('منصّات', 'SaaS'),
    summary: loc('ملخّص', 'Summary'),
    detailBody: loc(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Build a `PortfolioProjectItem` for a hydrated `portfolio` collection fixture (trust). */
export function portfolioItem(
  overrides: Partial<PortfolioProjectItem> = {},
): PortfolioProjectItem {
  return {
    id: id(),
    slug: 'proj',
    category: {
      id: 'cat-fintech',
      slug: 'fintech',
      name: loc('تقنية مالية', 'Fintech'),
    },
    coverMediaId: null,
    clientName: null,
    projectUrl: null,
    status: 'published',
    publishedAt: '2026-01-01T00:00:00.000Z',
    featured: false,
    sortOrder: 0,
    title: loc('مشروع', 'Project'),
    summary: loc(),
    challenge: loc(),
    solution: loc(),
    result: loc(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Build a `TestimonialItem` for a hydrated `testimonials` collection fixture. */
export function testimonialItem(
  overrides: Partial<TestimonialItem> = {},
): TestimonialItem {
  return {
    id: id(),
    authorName: 'Layla Mansour',
    companyName: 'Tadawul Pay',
    avatarMediaId: null,
    rating: 5,
    featured: false,
    sortOrder: 0,
    quote: loc('فريقٌ يُسنِدك', 'A team that backs you'),
    authorRole: loc('الرئيسة التنفيذية', 'CEO'),
    companyDescriptor: loc(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Build a `BlogPostItem` for a hydrated `blog` collection fixture. */
export function blogPostItem(
  overrides: Partial<BlogPostItem> = {},
): BlogPostItem {
  return {
    id: id(),
    slug: 'building-phase-by-phase',
    category: {
      id: 'cat-eng',
      slug: 'engineering',
      name: loc('هندسة', 'Engineering'),
    },
    author: null,
    tags: [],
    coverMediaId: null,
    status: 'published',
    publishedAt: '2026-03-14T00:00:00.000Z',
    readMinutes: 6,
    sortOrder: 0,
    title: loc('لماذا نبني مرحلةً تلو الأخرى', 'Why we build phase by phase'),
    excerpt: loc('التسليم المرحلي', 'Phased delivery'),
    body: loc(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Build a `FaqItem` for a hydrated `faq` collection fixture. */
export function faqItem(overrides: Partial<FaqItem> = {}): FaqItem {
  return {
    id: id(),
    category: 'general',
    sortOrder: 0,
    question: loc('كيف تعملون؟', 'How do you work?'),
    answer: loc('مرحلةً تلو الأخرى.', 'Phase by phase.'),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Build a `TeamMemberItem` for a hydrated `team` collection fixture. */
export function teamMemberItem(
  overrides: Partial<TeamMemberItem> = {},
): TeamMemberItem {
  return {
    id: id(),
    slug: 'member',
    avatarMediaId: null,
    email: null,
    linkedinUrl: null,
    githubUrl: null,
    featured: false,
    sortOrder: 0,
    name: loc('ليلى منصور', 'Layla Mansour'),
    role: loc('مهندسة', 'Engineer'),
    bio: loc(),
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Build a `BlockNode` with sane defaults, overridable per field. */
export function block(
  type: BlockType,
  overrides: Partial<BlockNode> = {},
): BlockNode {
  return {
    id: id(),
    type,
    sortOrder: 0,
    data: {},
    imageMediaId: null,
    title: loc(),
    body: loc(),
    ...overrides,
  };
}

/**
 * Build a `SectionNode` with sane defaults, overridable per field. Defaults to `richtext` — the
 * type that renders through the GENERIC `SectionBlock` body — so tests of generic behaviour aren't
 * captured by a registered per-type component (hero/stats dispatch to their own layout).
 */
export function section(overrides: Partial<SectionNode> = {}): SectionNode {
  return {
    id: id(),
    type: 'richtext',
    sortOrder: 0,
    published: true,
    eyebrow: loc(),
    title: loc(),
    subtitle: loc(),
    blocks: [],
    config: null,
    collection: null,
    ...overrides,
  };
}
