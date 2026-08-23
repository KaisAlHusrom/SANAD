import 'reflect-metadata';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq, sql } from 'drizzle-orm';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import {
  DateTimeService,
  DrizzleTransactionRunner,
  failIfDbTestsRequired,
} from '@sanad/database';
import {
  AuditRecorder,
  DrizzleAuditStore,
  auditTestResetSql,
  type AuditScope,
} from '@sanad/audit';
import {
  LEAD_DEDUP_DEFAULTS,
  LEAD_SPAM_BANDS,
  leadCreatedEventSchema,
  leadResubmittedEventSchema,
  type Lead,
  type LeadDedupSettings,
} from '@sanad/contracts';
import { LeadDedupSettingsResolver } from '../application/resolvers/lead-dedup-settings/index.js';
import {
  blockTable,
  schema,
  serviceTable,
  type ContentDb,
} from '../../db/schema/index.js';
import { BlogCategoryService } from '../application/services/blog-category.service.js';
import { BlogPostService } from '../application/services/blog-post.service.js';
import { BlogTagService } from '../application/services/blog-tag.service.js';
import { CollectionHydrationService } from '../application/services/collection-hydration.service.js';
import { FaqService } from '../application/services/faq.service.js';
import { LeadService } from '../application/services/lead/lead.service.js';
import { MediaReconcileService } from '../application/services/media-reconcile.service.js';
import { MenuService } from '../application/services/menu.service.js';
import { PageService } from '../application/services/page.service.js';
import { PortfolioCategoryService } from '../application/services/portfolio-category.service.js';
import { PortfolioProjectService } from '../application/services/portfolio-project.service.js';
import { ServiceService } from '../application/services/service.service.js';
import { TeamMemberService } from '../application/services/team-member.service.js';
import { TestimonialService } from '../application/services/testimonial.service.js';
import { BlockRepository } from './persistence/repositories/block.repository.js';
import { BlogCategoryRepository } from './persistence/repositories/blog-category.repository.js';
import { BlogPostTagRepository } from './persistence/repositories/blog-post-tag.repository.js';
import { BlogPostRepository } from './persistence/repositories/blog-post.repository.js';
import { BlogTagRepository } from './persistence/repositories/blog-tag.repository.js';
import { FaqRepository } from './persistence/repositories/faq.repository.js';
import { LeadRepository } from './persistence/repositories/lead.repository.js';
import { MenuItemRepository } from './persistence/repositories/menu-item.repository.js';
import { MenuRepository } from './persistence/repositories/menu.repository.js';
import { PortfolioCategoryRepository } from './persistence/repositories/portfolio-category.repository.js';
import { PortfolioProjectRepository } from './persistence/repositories/portfolio-project.repository.js';
import { PageRepository } from './persistence/repositories/page.repository.js';
import { ProcessedMessageRepository } from './persistence/repositories/processed-message.repository.js';
import { SectionRepository } from './persistence/repositories/section.repository.js';
import { ServiceRepository } from './persistence/repositories/service.repository.js';
import { TeamMemberRepository } from './persistence/repositories/team-member.repository.js';
import { TestimonialRepository } from './persistence/repositories/testimonial.repository.js';

// The dedicated test DB (TDD2) — the project's fixed dev Postgres port block. Created by
// infra/postgres/init/01-create-databases.sql. Tests SKIP cleanly when it's down.
const TEST_DB_URL = 'postgresql://sanad:sanad@localhost:5440/content_test';

// Resolve the migrations dir from THIS file, not the CWD — vitest's cwd differs by how it is
// invoked, and a CWD-relative path made `migrate()` throw and the suite SILENTLY skip (false green).
const MIGRATIONS_DIR = fileURLToPath(
  new URL('../../db/migrations', import.meta.url),
);

async function tryConnect(): Promise<pg.Pool | null> {
  const pool = new pg.Pool({
    connectionString: TEST_DB_URL,
    options: '-c timezone=UTC',
  });
  try {
    await pool.query('select 1');
    await migrate(drizzle(pool), { migrationsFolder: MIGRATIONS_DIR });
    return pool;
  } catch (error) {
    await pool.end().catch(() => undefined);
    failIfDbTestsRequired(TEST_DB_URL, error);
    return null;
  }
}

const pool = await tryConnect();
const describeDb = pool ? describe : describe.skip;
if (!pool) {
  console.warn(
    'content_test unreachable — skipping DB integration tests (TDD2). Start the dev Postgres to run them.',
  );
}

describeDb('content-service DB integration (content_test, TDD2)', () => {
  const activePool = pool;
  if (!activePool) {
    return; // never reached (suite is skipped) — narrows the type for TS
  }
  const db = drizzle(activePool, { schema }) as ContentDb;
  const clock = new DateTimeService();

  const pages = new PageRepository(db, clock);
  const sections = new SectionRepository(db, clock);
  const blocks = new BlockRepository(db, clock);
  const services = new ServiceRepository(db, clock);
  const testimonials = new TestimonialRepository(db, clock);
  const members = new TeamMemberRepository(db, clock);
  const faqs = new FaqRepository(db, clock);
  const menus = new MenuRepository(db, clock);
  const menuItems = new MenuItemRepository(db, clock);
  const portfolioCategories = new PortfolioCategoryRepository(db, clock);
  const portfolioProjects = new PortfolioProjectRepository(db, clock);
  const blogCategories = new BlogCategoryRepository(db, clock);
  const blogTags = new BlogTagRepository(db, clock);
  const blogPosts = new BlogPostRepository(db, clock);
  const blogPostTags = new BlogPostTagRepository(db);
  const leads = new LeadRepository(db, clock);
  const processed = new ProcessedMessageRepository();

  const serviceService = new ServiceService(services);
  const portfolioCategoryService = new PortfolioCategoryService(
    portfolioCategories,
  );
  const portfolioProjectService = new PortfolioProjectService(
    portfolioProjects,
    portfolioCategories,
    clock,
  );
  const testimonialService = new TestimonialService(testimonials);
  const teamMemberService = new TeamMemberService(members);
  const faqService = new FaqService(faqs);
  const menuService = new MenuService(menus, menuItems);
  const blogCategoryService = new BlogCategoryService(blogCategories);
  const blogTagService = new BlogTagService(blogTags);
  const blogPostService = new BlogPostService(
    blogPosts,
    blogCategories,
    blogTags,
    members,
    blogPostTags,
    clock,
  );
  const hydration = new CollectionHydrationService(
    serviceService,
    portfolioProjectService,
    testimonialService,
    blogPostService,
    faqService,
    teamMemberService,
  );
  const pageService = new PageService(pages, sections, blocks, hydration);

  // Real audit recorder against the real table (P8.10.B2) — the point is to prove the trail
  // lands in the SAME transaction as the lead write, which a fake could not show.
  const auditRecorder = new AuditRecorder(new DrizzleAuditStore(), clock);
  const auditScope: AuditScope = {
    // What the gateway forwards for an UNAUTHENTICATED public submit.
    actor: { userId: null, role: null, type: 'anonymous' },
    context: { ip: '85.10.1.4', userAgent: 'Mozilla/5.0', requestId: 'req-b2' },
  };
  // A settable stand-in for the settings round trip; the resolver has its own unit spec.
  let dedupSettings: LeadDedupSettings = LEAD_DEDUP_DEFAULTS;
  const dedupResolver = {
    current: () => Promise.resolve(dedupSettings),
  } as LeadDedupSettingsResolver;
  const leadService = new LeadService(
    leads,
    clock,
    new DrizzleTransactionRunner(db),
    auditRecorder,
    dedupResolver,
  );
  /** Every submit arrives inside the interceptor's actor scope in production. */
  const submit = (req: Parameters<typeof leadService.submit>[0]) =>
    auditRecorder.runInScope(auditScope, () => leadService.submit(req));
  const reconcile = new MediaReconcileService(processed, db);

  beforeEach(async () => {
    await db.execute(
      sql`truncate table
        "block_translation", "block", "section_translation", "section",
        "page_translation", "page", "service_translation", "service",
        "testimonial_translation", "testimonial",
        "team_member_translation", "team_member",
        "faq_translation", "faq",
        "menu_item_translation", "menu_item", "menu",
        "portfolio_project_translation", "portfolio_project",
        "portfolio_category_translation", "portfolio_category",
        "blog_post_tag", "blog_post_translation", "blog_post",
        "blog_tag_translation", "blog_tag",
        "blog_category_translation", "blog_category",
        "lead", "processed_message", "outbox"
        restart identity cascade`,
    );
    // `audit_log` is truncate-GUARDED, so it resets through the audit lib's sanctioned path —
    // putting it in the bulk truncate above would raise SQLSTATE 23001 and fail every test.
    await db.execute(sql.raw(auditTestResetSql()));
    dedupSettings = LEAD_DEDUP_DEFAULTS;
  });

  it('TranslatableRepository canon: createLocalized + updateLocalized + findAllTranslations (N5)', async () => {
    const created = await services.createLocalized(
      {
        slug: 'canon-saas',
        category: 'core',
        title: 'منصّات',
        summary: 'ملخّص',
      },
      'ar',
    );
    await services.updateLocalized(
      created.id,
      { title: 'SaaS', summary: 'Summary', detailBody: 'Details' },
      'en',
    );

    const all = await services.findAllTranslations(created.id);
    expect(all['title']).toEqual({ ar: 'منصّات', en: 'SaaS' });
    expect(all['summary']).toEqual({ ar: 'ملخّص', en: 'Summary' });

    const ar = (await services.mergeTranslations([created], 'ar')) as Array<
      Record<string, unknown>
    >;
    expect(ar[0]?.['title']).toBe('منصّات');
    const en = (await services.mergeTranslations([created], 'en')) as Array<
      Record<string, unknown>
    >;
    expect(en[0]?.['title']).toBe('SaaS');
  });

  it('service CRUD works in BOTH locales and search resolves cross-locale (the Done-when)', async () => {
    const created = await serviceService.create({
      slug: 'saas',
      category: 'core',
      sortOrder: 0,
      title: { ar: 'منصّات SaaS', en: 'SaaS platforms' },
      summary: { ar: 'منتجات سحابية', en: 'Cloud products' },
    });
    expect(created.title).toEqual({ ar: 'منصّات SaaS', en: 'SaaS platforms' });

    const bySlug = await serviceService.getBySlug('saas');
    expect(bySlug.title.ar).toBe('منصّات SaaS');
    expect(bySlug.title.en).toBe('SaaS platforms');

    // English search term matches the en translation (cross-locale, searchAcrossLocales).
    const byEn = await serviceService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      search: 'platforms',
    });
    expect(byEn.items.some((s) => s.id === created.id)).toBe(true);

    // Arabic search term matches the ar translation.
    const byAr = await serviceService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      search: 'منصّات',
    });
    expect(byAr.items.some((s) => s.id === created.id)).toBe(true);

    // category filter
    const core = await serviceService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      category: 'core',
    });
    expect(core.items.some((s) => s.id === created.id)).toBe(true);
  });

  it('testimonial CRUD works in BOTH locales + featured filter + cross-locale search (the Done-when)', async () => {
    const created = await testimonialService.create({
      authorName: 'Layla Mansour',
      companyName: 'Tadawul Pay',
      rating: 5,
      featured: true,
      sortOrder: 0,
      quote: { ar: 'فريقٌ يُسنِدك', en: 'A team that backs you' },
      authorRole: { ar: 'الرئيسة التنفيذية', en: 'CEO' },
    });
    expect(created.quote).toEqual({
      ar: 'فريقٌ يُسنِدك',
      en: 'A team that backs you',
    });
    expect(created.companyDescriptor).toEqual({ ar: '', en: '' }); // unset → null-safe (F7)
    expect(created.featured).toBe(true);

    // update one locale + a base column; the other locale survives (W6)
    await testimonialService.update({
      id: created.id,
      sortOrder: 3,
      quote: { ar: 'فريقٌ يُسنِدك حقًّا', en: 'A team that truly backs you' },
    });

    // featured filter returns it; non-featured filter excludes it (N7 boolean)
    const featured = await testimonialService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      featured: true,
    });
    expect(featured.items.some((t) => t.id === created.id)).toBe(true);
    const notFeatured = await testimonialService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      featured: false,
    });
    expect(notFeatured.items.some((t) => t.id === created.id)).toBe(false);

    // cross-locale search (English term matches the en quote)
    const byEn = await testimonialService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      search: 'truly backs',
    });
    expect(byEn.items.some((t) => t.id === created.id)).toBe(true);

    await testimonialService.delete(created.id);
    const afterDelete = await testimonialService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
    });
    expect(afterDelete.items.some((t) => t.id === created.id)).toBe(false);
  });

  it('team-member CRUD works in BOTH locales + getBySlug + cross-locale search (the Done-when)', async () => {
    const created = await teamMemberService.create({
      slug: 'sara-noor',
      featured: true,
      sortOrder: 0,
      linkedinUrl: 'https://linkedin.com/in/sara',
      name: { ar: 'سارة نور', en: 'Sara Noor' },
      role: { ar: 'مديرة المنتج', en: 'Head of Product' },
    });
    expect(created.name).toEqual({ ar: 'سارة نور', en: 'Sara Noor' });
    expect(created.bio).toEqual({ ar: '', en: '' }); // unset → null-safe (F7)

    const bySlug = await teamMemberService.getBySlug('sara-noor');
    expect(bySlug.role.ar).toBe('مديرة المنتج');
    expect(bySlug.role.en).toBe('Head of Product');

    // Arabic search term matches the ar name (cross-locale)
    const byAr = await teamMemberService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      search: 'سارة',
    });
    expect(byAr.items.some((m) => m.id === created.id)).toBe(true);
  });

  it('portfolio CRUD works in BOTH locales, embeds the category, hides drafts + stamps publishedAt (the Done-when)', async () => {
    const category = await portfolioCategoryService.create({
      slug: 'payments',
      sortOrder: 0,
      name: { ar: 'المدفوعات', en: 'Payments' },
    });

    // create as draft (default)
    const created = await portfolioProjectService.create({
      slug: 'tadawul-pay',
      categoryId: category.id,
      clientName: 'Tadawul Pay',
      status: 'draft',
      featured: true,
      sortOrder: 0,
      title: { ar: 'تداول باي', en: 'Tadawul Pay' },
      summary: { ar: 'منصّة مدفوعات', en: 'A payments platform' },
      challenge: { ar: 'التحدي', en: 'The challenge' },
    });
    expect(created.title).toEqual({ ar: 'تداول باي', en: 'Tadawul Pay' });
    expect(created.category?.slug).toBe('payments');
    expect(created.category?.name).toEqual({ ar: 'المدفوعات', en: 'Payments' });
    expect(created.status).toBe('draft');
    expect(created.publishedAt).toBeNull(); // not published yet

    // public list (status=published, as the gateway forces) excludes the draft (WEB2)
    const publishedOnly = await portfolioProjectService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      status: 'published',
    });
    expect(publishedOnly.items.some((p) => p.id === created.id)).toBe(false);

    // public detail 404s for a draft
    await expect(
      portfolioProjectService.getBySlug('tadawul-pay'),
    ).rejects.toBeDefined();

    // publish → publishedAt stamped, now visible + detail resolves with embedded category
    const published = await portfolioProjectService.update({
      id: created.id,
      status: 'published',
    });
    expect(published.publishedAt).not.toBeNull();

    const visible = await portfolioProjectService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      status: 'published',
    });
    expect(visible.items.some((p) => p.id === created.id)).toBe(true);

    const detail = await portfolioProjectService.getBySlug('tadawul-pay');
    expect(detail.category?.slug).toBe('payments');
    expect(detail.challenge.en).toBe('The challenge');

    // featured filter + cross-locale search
    const featured = await portfolioProjectService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      featured: true,
      status: 'published',
    });
    expect(featured.items.some((p) => p.id === created.id)).toBe(true);
    const byAr = await portfolioProjectService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      search: 'تداول',
    });
    expect(byAr.items.some((p) => p.id === created.id)).toBe(true);
  });

  it('blog post CRUD works in BOTH locales, embeds category+author+tags (M2M), hides drafts + stamps publishedAt (the Done-when)', async () => {
    const category = await blogCategoryService.create({
      slug: 'engineering',
      sortOrder: 0,
      name: { ar: 'الهندسة', en: 'Engineering' },
    });
    const author = await teamMemberService.create({
      slug: 'samer-al-hasan',
      featured: true,
      sortOrder: 0,
      name: { ar: 'سامر الحسن', en: 'Samer Al-Hasan' },
      role: { ar: 'القائد التقني', en: 'CTO' },
    });
    const tagA = await blogTagService.create({
      slug: 'microservices',
      sortOrder: 0,
      name: { ar: 'الخدمات المصغّرة', en: 'Microservices' },
    });
    const tagB = await blogTagService.create({
      slug: 'process',
      sortOrder: 1,
      name: { ar: 'آلية العمل', en: 'Process' },
    });

    // create as draft with the M2M tag set + embedded refs (ids-on-write)
    const created = await blogPostService.create({
      slug: 'building-phase-by-phase',
      categoryId: category.id,
      authorTeamMemberId: author.id,
      coverMediaId: null,
      status: 'draft',
      readMinutes: 6,
      sortOrder: 0,
      tagIds: [tagA.id, tagB.id],
      title: {
        ar: 'لماذا نبني مرحلةً تلو الأخرى',
        en: 'Why we build phase by phase',
      },
      excerpt: { ar: 'التسليم المرحلي', en: 'Phased delivery' },
      body: { ar: 'النص الكامل', en: 'The full body' },
    });
    expect(created.title).toEqual({
      ar: 'لماذا نبني مرحلةً تلو الأخرى',
      en: 'Why we build phase by phase',
    });
    expect(created.category?.slug).toBe('engineering');
    expect(created.category?.name).toEqual({
      ar: 'الهندسة',
      en: 'Engineering',
    });
    expect(created.author?.slug).toBe('samer-al-hasan');
    expect(created.author?.name.en).toBe('Samer Al-Hasan');
    expect(created.tags.map((t) => t.slug).sort()).toEqual([
      'microservices',
      'process',
    ]);
    expect(created.status).toBe('draft');
    expect(created.publishedAt).toBeNull();

    // public list (status=published as the gateway forces) excludes the draft (WEB2)
    const publishedOnly = await blogPostService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      status: 'published',
    });
    expect(publishedOnly.items.some((p) => p.id === created.id)).toBe(false);

    // public detail 404s for a draft
    await expect(
      blogPostService.getBySlug('building-phase-by-phase'),
    ).rejects.toBeDefined();

    // publish → publishedAt stamped, now visible + detail embeds category/author/tags
    const published = await blogPostService.update({
      id: created.id,
      status: 'published',
    });
    expect(published.publishedAt).not.toBeNull();

    const detail = await blogPostService.getBySlug('building-phase-by-phase');
    expect(detail.category?.slug).toBe('engineering');
    expect(detail.author?.slug).toBe('samer-al-hasan');
    expect(detail.tags).toHaveLength(2);

    // update REPLACES the tag set (M2M setTagsFor delete-then-insert)
    await blogPostService.update({ id: created.id, tagIds: [tagB.id] });
    const afterRetag = await blogPostService.getBySlug(
      'building-phase-by-phase',
    );
    expect(afterRetag.tags.map((t) => t.slug)).toEqual(['process']);

    // category filter + cross-locale search (Arabic term matches the ar title)
    const inCategory = await blogPostService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      status: 'published',
      categoryId: category.id,
    });
    expect(inCategory.items.some((p) => p.id === created.id)).toBe(true);
    const byAr = await blogPostService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      search: 'مرحلة',
    });
    expect(byAr.items.some((p) => p.id === created.id)).toBe(true);

    // tagIdsForMany batch returns the (replaced) single tag for the post (N+1-safe embed)
    const tagMap = await blogPostTags.tagIdsForMany([created.id]);
    expect(tagMap.get(created.id)).toEqual([tagB.id]);
  });

  it('faq CRUD works in BOTH locales + category filter + cross-locale search (the Done-when)', async () => {
    const created = await faqService.create({
      category: 'pricing',
      sortOrder: 0,
      question: { ar: 'كيف تُحتسب التكلفة؟', en: 'How is pricing determined?' },
      answer: { ar: 'حسب نطاق المشروع.', en: 'By project scope.' },
    });
    expect(created.question.ar).toBe('كيف تُحتسب التكلفة؟');
    expect(created.answer.en).toBe('By project scope.');
    expect(created.category).toBe('pricing');

    // category filter
    const pricing = await faqService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      category: 'pricing',
    });
    expect(pricing.items.some((f) => f.id === created.id)).toBe(true);
    const process = await faqService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      category: 'process',
    });
    expect(process.items.some((f) => f.id === created.id)).toBe(false);

    // cross-locale search (Arabic term matches the ar question)
    const byAr = await faqService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      search: 'التكلفة',
    });
    expect(byAr.items.some((f) => f.id === created.id)).toBe(true);
  });

  it('assembles a menu by key into a one-level item tree, both locales (the Done-when)', async () => {
    const menu = await menuService.create({ key: 'primary', sortOrder: 0 });
    const services = await menuService.createItem({
      menuId: menu.id,
      url: '/services',
      sortOrder: 0,
      label: { ar: 'خدماتنا', en: 'Services' },
    });
    // a nested child under "services" (one level of nesting)
    await menuService.createItem({
      menuId: menu.id,
      parentId: services.id,
      url: '/services/saas',
      sortOrder: 0,
      label: { ar: 'منصّات SaaS', en: 'SaaS' },
    });
    await menuService.createItem({
      menuId: menu.id,
      url: '/contact',
      sortOrder: 1,
      label: { ar: 'تواصل معنا', en: 'Contact' },
    });

    const tree = await menuService.getByKey('primary');
    expect(tree.key).toBe('primary');
    // two top-level items, ordered by sortOrder
    expect(tree.items).toHaveLength(2);
    expect(tree.items[0]?.label).toEqual({ ar: 'خدماتنا', en: 'Services' });
    expect(tree.items[0]?.children).toHaveLength(1);
    expect(tree.items[0]?.children[0]?.label).toEqual({
      ar: 'منصّات SaaS',
      en: 'SaaS',
    });
    expect(tree.items[1]?.url).toBe('/contact');

    // a missing menu key 404s (RpcException) — proven by getByKey on a fresh empty footer
    await expect(menuService.getByKey('footer')).rejects.toBeDefined();

    // admin list returns the summary (no items)
    const list = await menuService.list();
    expect(list.some((m) => m.id === menu.id)).toBe(true);
  });

  it('reorders menu items within a menu atomically (P7 menus, U21)', async () => {
    const menu = await menuService.create({ key: 'footer', sortOrder: 1 });
    const make = (order: number): Promise<{ id: string }> =>
      menuService.createItem({
        menuId: menu.id,
        url: `/item-${order}`,
        sortOrder: order,
        label: { ar: `عنصر ${order}`, en: `Item ${order}` },
      });
    const a = await make(0);
    const b = await make(1);
    const c = await make(2);

    await menuService.reorderItems([c.id, a.id, b.id]);
    const tree = await menuService.getByKey('footer');
    expect(tree.items.map((item) => item.id)).toEqual([c.id, a.id, b.id]);
  });

  it('assembles a Page→Section→Block tree with copy in both locales (the Done-when)', async () => {
    const page = await pageService.upsertPage({
      slug: 'landing',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'الصفحة الرئيسية', en: 'Landing' },
    });
    const section = await pageService.upsertSection({
      pageId: page.id,
      type: 'stats',
      sortOrder: 0,
      published: true,
      eyebrow: { ar: 'أرقام', en: 'Numbers' },
      title: { ar: 'أرقامٌ تختصر رحلتنا', en: 'The numbers behind the work' },
    });
    await pageService.upsertBlock({
      sectionId: section.id,
      type: 'stat',
      sortOrder: 0,
      data: { value: 120, suffix: '+' },
      title: { ar: 'مشروعًا سُلّم', en: 'Projects delivered' },
    });

    const tree = await pageService.getTree('landing');
    expect(tree).not.toBeNull();
    expect(tree?.title).toEqual({ ar: 'الصفحة الرئيسية', en: 'Landing' });
    expect(tree?.sections).toHaveLength(1);
    const firstSection = tree?.sections[0];
    expect(firstSection?.type).toBe('stats');
    expect(firstSection?.title.ar).toBe('أرقامٌ تختصر رحلتنا');
    expect(firstSection?.blocks).toHaveLength(1);
    const firstBlock = firstSection?.blocks[0];
    expect(firstBlock?.data).toEqual({ value: 120, suffix: '+' });
    expect(firstBlock?.title).toEqual({
      ar: 'مشروعًا سُلّم',
      en: 'Projects delivered',
    });
  });

  it('hydrates a services section in-service from its config (all → sortOrder+limit; picked → ids in order); non-collection sections stay null (Phase 3)', async () => {
    // three services in a known sortOrder
    const alpha = await serviceService.create({
      slug: 'alpha',
      category: 'core',
      sortOrder: 0,
      title: { ar: 'ألفا', en: 'Alpha' },
    });
    const beta = await serviceService.create({
      slug: 'beta',
      category: 'core',
      sortOrder: 1,
      title: { ar: 'بيتا', en: 'Beta' },
    });
    const gamma = await serviceService.create({
      slug: 'gamma',
      category: 'support',
      sortOrder: 2,
      title: { ar: 'غاما', en: 'Gamma' },
    });

    const page = await pageService.upsertPage({
      slug: 'landing',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'الرئيسية', en: 'Landing' },
    });
    // a services section with mode:all + limit 2 → first two by sortOrder
    const servicesSection = await pageService.upsertSection({
      pageId: page.id,
      type: 'services',
      sortOrder: 0,
      published: true,
      title: { ar: 'خدماتنا', en: 'Services' },
      config: { mode: 'all', limit: 2, ids: [] },
    });
    // a non-collection section stays null
    await pageService.upsertSection({
      pageId: page.id,
      type: 'hero',
      sortOrder: 1,
      published: true,
      title: { ar: 'بطل', en: 'Hero' },
    });

    // upsert already returns the section hydrated (write-back path)
    expect(servicesSection.config).toEqual({ mode: 'all', limit: 2, ids: [] });
    expect(servicesSection.collection?.collection).toBe('services');

    const tree = await pageService.getTree('landing');
    const svc = tree?.sections.find((s) => s.type === 'services');
    const hero = tree?.sections.find((s) => s.type === 'hero');
    expect(svc?.collection?.collection).toBe('services');
    // mode:all limit 2 → alpha, beta in sortOrder (not gamma)
    if (svc?.collection?.collection === 'services') {
      expect(svc.collection.items.map((i) => i.slug)).toEqual([
        'alpha',
        'beta',
      ]);
    }
    // non-collection section → null (no hydrator)
    expect(hero?.collection).toBeNull();
    expect(hero?.config).toBeNull();

    // switch to picked → exactly the ids, IN THE GIVEN ORDER (gamma before alpha)
    await pageService.upsertSection({
      id: svc?.id,
      pageId: page.id,
      type: 'services',
      sortOrder: 0,
      published: true,
      config: { mode: 'picked', ids: [gamma.id, alpha.id] },
    });
    const picked = await pageService.getTree('landing');
    const pickedSvc = picked?.sections.find((s) => s.type === 'services');
    if (pickedSvc?.collection?.collection === 'services') {
      expect(pickedSvc.collection.items.map((i) => i.id)).toEqual([
        gamma.id,
        alpha.id,
      ]);
    }

    // an inline copy edit (no config in the body) must NOT wipe the stored config
    await pageService.upsertSection({
      id: svc?.id,
      pageId: page.id,
      type: 'services',
      sortOrder: 0,
      published: true,
      title: { ar: 'خدماتنا المحدّثة', en: 'Our services' },
    });
    const afterCopyEdit = await pageService.getTree('landing');
    const stillPicked = afterCopyEdit?.sections.find(
      (s) => s.type === 'services',
    );
    expect(stillPicked?.config?.mode).toBe('picked');
    expect(beta).toBeDefined(); // (beta exists but is neither picked)
  });

  it('hydrates a faq section from the faq collection (all → sortOrder+limit; picked → ids in order) — Phase 5', async () => {
    const one = await faqService.create({
      category: 'general',
      sortOrder: 0,
      question: { ar: 'سؤال ١', en: 'Q1' },
      answer: { ar: 'جواب ١', en: 'A1' },
    });
    const two = await faqService.create({
      category: 'pricing',
      sortOrder: 1,
      question: { ar: 'سؤال ٢', en: 'Q2' },
      answer: { ar: 'جواب ٢', en: 'A2' },
    });
    const three = await faqService.create({
      category: 'support',
      sortOrder: 2,
      question: { ar: 'سؤال ٣', en: 'Q3' },
      answer: { ar: 'جواب ٣', en: 'A3' },
    });

    const page = await pageService.upsertPage({
      slug: 'faq',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'الأسئلة', en: 'FAQ' },
    });
    const faqSection = await pageService.upsertSection({
      pageId: page.id,
      type: 'faq',
      sortOrder: 0,
      published: true,
      title: { ar: 'أسئلة', en: 'Questions' },
      config: { mode: 'all', limit: 2, ids: [] },
    });
    // write-back path hydrates immediately
    expect(faqSection.collection?.collection).toBe('faq');

    const tree = await pageService.getTree('faq');
    const faq = tree?.sections.find((s) => s.type === 'faq');
    // mode:all limit 2 → first two by sortOrder
    if (faq?.collection?.collection === 'faq') {
      expect(faq.collection.items.map((i) => i.id)).toEqual([one.id, two.id]);
    }

    // picked → exactly the ids, in the given order (three before one)
    await pageService.upsertSection({
      id: faq?.id,
      pageId: page.id,
      type: 'faq',
      sortOrder: 0,
      published: true,
      config: { mode: 'picked', ids: [three.id, one.id] },
    });
    const picked = await pageService.getTree('faq');
    const pickedFaq = picked?.sections.find((s) => s.type === 'faq');
    if (pickedFaq?.collection?.collection === 'faq') {
      expect(pickedFaq.collection.items.map((i) => i.id)).toEqual([
        three.id,
        one.id,
      ]);
    }
    expect(two).toBeDefined();
  });

  it('hydrates a team section from the team collection (featured → only flagged; picked → ids in order) — Phase 5', async () => {
    const lead = await teamMemberService.create({
      slug: 'lead',
      featured: true,
      sortOrder: 0,
      name: { ar: 'القائد', en: 'Lead' },
      role: { ar: 'مدير', en: 'Director' },
    });
    const eng = await teamMemberService.create({
      slug: 'eng',
      featured: false,
      sortOrder: 1,
      name: { ar: 'مهندس', en: 'Engineer' },
      role: { ar: 'مطوّر', en: 'Developer' },
    });

    const page = await pageService.upsertPage({
      slug: 'about',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'من نحن', en: 'About' },
    });
    // featured → only the flagged member
    const teamSection = await pageService.upsertSection({
      pageId: page.id,
      type: 'team',
      sortOrder: 0,
      published: true,
      title: { ar: 'فريقنا', en: 'Team' },
      config: { mode: 'featured', ids: [] },
    });
    expect(teamSection.collection?.collection).toBe('team');

    const tree = await pageService.getTree('about');
    const team = tree?.sections.find((s) => s.type === 'team');
    if (team?.collection?.collection === 'team') {
      expect(team.collection.items.map((i) => i.slug)).toEqual(['lead']);
    }

    // picked → exactly the ids, in the given order (eng before lead)
    await pageService.upsertSection({
      id: team?.id,
      pageId: page.id,
      type: 'team',
      sortOrder: 0,
      published: true,
      config: { mode: 'picked', ids: [eng.id, lead.id] },
    });
    const picked = await pageService.getTree('about');
    const pickedTeam = picked?.sections.find((s) => s.type === 'team');
    if (pickedTeam?.collection?.collection === 'team') {
      expect(pickedTeam.collection.items.map((i) => i.id)).toEqual([
        eng.id,
        lead.id,
      ]);
    }
  });

  it('hydrates a trust section from the portfolio collection (all → published sortOrder+limit; drafts hidden on the public tree) — the trust swap', async () => {
    const category = await portfolioCategoryService.create({
      slug: 'fintech',
      sortOrder: 0,
      name: { ar: 'تقنية مالية', en: 'Fintech' },
    });
    // two published projects + one draft — the draft must NOT reach the public constellation
    const one = await portfolioProjectService.create({
      slug: 'proj-one',
      categoryId: category.id,
      status: 'published',
      featured: false,
      sortOrder: 0,
      title: { ar: 'مشروع واحد', en: 'Project One' },
    });
    await portfolioProjectService.create({
      slug: 'proj-two',
      categoryId: category.id,
      status: 'published',
      featured: false,
      sortOrder: 1,
      title: { ar: 'مشروع اثنان', en: 'Project Two' },
    });
    await portfolioProjectService.create({
      slug: 'proj-draft',
      categoryId: category.id,
      status: 'draft',
      featured: false,
      sortOrder: 2,
      title: { ar: 'مسودة', en: 'Draft' },
    });

    const page = await pageService.upsertPage({
      slug: 'landing',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'الرئيسية', en: 'Landing' },
    });
    const trustSection = await pageService.upsertSection({
      pageId: page.id,
      type: 'trust',
      sortOrder: 0,
      published: true,
      title: { ar: 'من نخدم', en: 'Who we serve' },
      config: { mode: 'all', ids: [] },
    });
    // write-back path (admin, publishedOnly:false) sees the draft too
    expect(trustSection.collection?.collection).toBe('portfolio');

    const tree = await pageService.getTree('landing');
    const trust = tree?.sections.find((s) => s.type === 'trust');
    expect(trust?.collection?.collection).toBe('portfolio');
    // public tree → only the two PUBLISHED projects, in sortOrder (draft hidden — WEB2)
    if (trust?.collection?.collection === 'portfolio') {
      expect(trust.collection.items.map((i) => i.slug)).toEqual([
        'proj-one',
        'proj-two',
      ]);
      expect(trust.collection.items[0]?.category?.slug).toBe('fintech');
    }
    expect(one).toBeDefined();
  });

  it('hydrates a work section from the portfolio collection (featured → only featured; picked → ids in order; all → sortOrder+limit) — the works swap', async () => {
    const category = await portfolioCategoryService.create({
      slug: 'commerce',
      sortOrder: 0,
      name: { ar: 'تجارة', en: 'Commerce' },
    });
    // one featured + one non-featured (both published) + one featured DRAFT (never public)
    const flagship = await portfolioProjectService.create({
      slug: 'flagship',
      categoryId: category.id,
      status: 'published',
      featured: true,
      sortOrder: 0,
      title: { ar: 'الرائد', en: 'Flagship' },
    });
    const secondary = await portfolioProjectService.create({
      slug: 'secondary',
      categoryId: category.id,
      status: 'published',
      featured: false,
      sortOrder: 1,
      title: { ar: 'ثانوي', en: 'Secondary' },
    });
    await portfolioProjectService.create({
      slug: 'featured-draft',
      categoryId: category.id,
      status: 'draft',
      featured: true,
      sortOrder: 2,
      title: { ar: 'مسودة مميزة', en: 'Featured draft' },
    });

    const page = await pageService.upsertPage({
      slug: 'landing',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'الرئيسية', en: 'Landing' },
    });
    // mode:'featured' → only the published featured project (draft featured hidden — WEB2)
    const workSection = await pageService.upsertSection({
      pageId: page.id,
      type: 'work',
      sortOrder: 0,
      published: true,
      title: { ar: 'أعمالنا', en: 'Selected work' },
      config: { mode: 'featured', ids: [] },
    });
    expect(workSection.collection?.collection).toBe('portfolio');

    const tree = await pageService.getTree('landing');
    const work = tree?.sections.find((s) => s.type === 'work');
    expect(work?.collection?.collection).toBe('portfolio');
    if (work?.collection?.collection === 'portfolio') {
      // featured reel → only the published flagship (not the non-featured, not the draft)
      expect(work.collection.items.map((i) => i.slug)).toEqual(['flagship']);
    }

    // switch to picked → exactly the ids IN ORDER (secondary before flagship)
    await pageService.upsertSection({
      id: work?.id,
      pageId: page.id,
      type: 'work',
      sortOrder: 0,
      published: true,
      config: { mode: 'picked', ids: [secondary.id, flagship.id] },
    });
    const picked = (await pageService.getTree('landing'))?.sections.find(
      (s) => s.type === 'work',
    );
    if (picked?.collection?.collection === 'portfolio') {
      expect(picked.collection.items.map((i) => i.slug)).toEqual([
        'secondary',
        'flagship',
      ]);
    }

    // switch to all → both published projects in sortOrder (draft still hidden)
    await pageService.upsertSection({
      id: work?.id,
      pageId: page.id,
      type: 'work',
      sortOrder: 0,
      published: true,
      config: { mode: 'all', ids: [] },
    });
    const all = (await pageService.getTree('landing'))?.sections.find(
      (s) => s.type === 'work',
    );
    if (all?.collection?.collection === 'portfolio') {
      expect(all.collection.items.map((i) => i.slug)).toEqual([
        'flagship',
        'secondary',
      ]);
    }
  });

  it('hydrates a testimonials section from the testimonials collection (all → sortOrder+limit; featured → only featured; picked → ids in order) — the testimonials swap', async () => {
    // one featured + one non-featured — the featured reel must show only the flagged one
    const flagship = await testimonialService.create({
      authorName: 'Layla Mansour',
      companyName: 'Tadawul Pay',
      rating: 5,
      featured: true,
      sortOrder: 0,
      quote: { ar: 'فريقٌ يُسنِدك', en: 'A team that backs you' },
    });
    const secondary = await testimonialService.create({
      authorName: 'Omar Nasser',
      companyName: 'Wasla',
      rating: 4,
      featured: false,
      sortOrder: 1,
      quote: { ar: 'شراكةٌ حقيقية', en: 'A true partnership' },
    });

    const page = await pageService.upsertPage({
      slug: 'landing',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'الرئيسية', en: 'Landing' },
    });
    // mode:'featured' → only the flagged testimonial
    const section = await pageService.upsertSection({
      pageId: page.id,
      type: 'testimonials',
      sortOrder: 0,
      published: true,
      title: { ar: 'آراء العملاء', en: 'Clients' },
      config: { mode: 'featured', ids: [] },
    });
    expect(section.collection?.collection).toBe('testimonials');

    const featured = (await pageService.getTree('landing'))?.sections.find(
      (s) => s.type === 'testimonials',
    );
    if (featured?.collection?.collection === 'testimonials') {
      expect(featured.collection.items.map((i) => i.authorName)).toEqual([
        'Layla Mansour',
      ]);
    }

    // switch to picked → exactly the ids IN ORDER (secondary before flagship)
    await pageService.upsertSection({
      id: featured?.id,
      pageId: page.id,
      type: 'testimonials',
      sortOrder: 0,
      published: true,
      config: { mode: 'picked', ids: [secondary.id, flagship.id] },
    });
    const picked = (await pageService.getTree('landing'))?.sections.find(
      (s) => s.type === 'testimonials',
    );
    if (picked?.collection?.collection === 'testimonials') {
      expect(picked.collection.items.map((i) => i.authorName)).toEqual([
        'Omar Nasser',
        'Layla Mansour',
      ]);
    }

    // switch to all → both testimonials in sortOrder
    await pageService.upsertSection({
      id: featured?.id,
      pageId: page.id,
      type: 'testimonials',
      sortOrder: 0,
      published: true,
      config: { mode: 'all', ids: [] },
    });
    const all = (await pageService.getTree('landing'))?.sections.find(
      (s) => s.type === 'testimonials',
    );
    if (all?.collection?.collection === 'testimonials') {
      expect(all.collection.items.map((i) => i.authorName)).toEqual([
        'Layla Mansour',
        'Omar Nasser',
      ]);
    }
  });

  it('hydrates a blog section from the blog collection (all → published sortOrder+limit, drafts hidden; picked → ids in order; embedded category/author/tags survive) — the blog swap', async () => {
    const category = await blogCategoryService.create({
      slug: 'engineering',
      sortOrder: 0,
      name: { ar: 'هندسة', en: 'Engineering' },
    });
    const author = await teamMemberService.create({
      slug: 'samer-al-hasan',
      featured: true,
      sortOrder: 0,
      name: { ar: 'سامر الحسن', en: 'Samer Al-Hasan' },
      role: { ar: 'القائد التقني', en: 'CTO' },
    });
    const tag = await blogTagService.create({
      slug: 'microservices',
      sortOrder: 0,
      name: { ar: 'الخدمات المصغّرة', en: 'Microservices' },
    });
    // two published + one draft — the draft must NOT reach the public teaser
    const first = await blogPostService.create({
      slug: 'post-one',
      categoryId: category.id,
      authorTeamMemberId: author.id,
      coverMediaId: null,
      status: 'published',
      readMinutes: 5,
      sortOrder: 0,
      tagIds: [tag.id],
      title: { ar: 'مقالة واحد', en: 'Post One' },
    });
    const second = await blogPostService.create({
      slug: 'post-two',
      status: 'published',
      readMinutes: 4,
      sortOrder: 1,
      tagIds: [],
      title: { ar: 'مقالة اثنان', en: 'Post Two' },
    });
    await blogPostService.create({
      slug: 'post-draft',
      status: 'draft',
      sortOrder: 2,
      tagIds: [],
      title: { ar: 'مسودة', en: 'Draft' },
    });

    const page = await pageService.upsertPage({
      slug: 'landing',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'الرئيسية', en: 'Landing' },
    });
    const section = await pageService.upsertSection({
      pageId: page.id,
      type: 'blog',
      sortOrder: 0,
      published: true,
      title: { ar: 'المدونة', en: 'Blog' },
      config: { mode: 'all', ids: [] },
    });
    expect(section.collection?.collection).toBe('blog');

    const tree = await pageService.getTree('landing');
    const blog = tree?.sections.find((s) => s.type === 'blog');
    // public tree → only the two PUBLISHED posts, in sortOrder (draft hidden — WEB2)
    if (blog?.collection?.collection === 'blog') {
      expect(blog.collection.items.map((i) => i.slug)).toEqual([
        'post-one',
        'post-two',
      ]);
      // embedded refs survive hydration
      expect(blog.collection.items[0]?.category?.slug).toBe('engineering');
      expect(blog.collection.items[0]?.author?.slug).toBe('samer-al-hasan');
      expect(blog.collection.items[0]?.tags.map((t) => t.slug)).toEqual([
        'microservices',
      ]);
    }

    // switch to picked → exactly the ids IN ORDER (second before first)
    await pageService.upsertSection({
      id: blog?.id,
      pageId: page.id,
      type: 'blog',
      sortOrder: 0,
      published: true,
      config: { mode: 'picked', ids: [second.id, first.id] },
    });
    const picked = (await pageService.getTree('landing'))?.sections.find(
      (s) => s.type === 'blog',
    );
    if (picked?.collection?.collection === 'blog') {
      expect(picked.collection.items.map((i) => i.slug)).toEqual([
        'post-two',
        'post-one',
      ]);
    }
  });

  it('does not expose a draft page on the public tree read (WEB2)', async () => {
    await pageService.upsertPage({
      slug: 'secret',
      status: 'draft',
      sortOrder: 0,
      title: { ar: 'مسودة', en: 'Draft' },
    });
    expect(await pageService.getTree('secret')).toBeNull();
  });

  it('exposes a draft page + unpublished sections on the admin tree (P7 builder)', async () => {
    const page = await pageService.upsertPage({
      slug: 'about',
      status: 'draft',
      sortOrder: 0,
      title: { ar: 'من نحن', en: 'About' },
    });
    await pageService.upsertSection({
      pageId: page.id,
      type: 'hero',
      sortOrder: 0,
      published: false,
      title: { ar: 'بطل مخفي', en: 'Hidden hero' },
    });

    // Public read hides the draft entirely; the admin read sees it with its unpublished section.
    expect(await pageService.getTree('about')).toBeNull();
    const tree = await pageService.getAdminTree(page.id);
    expect(tree).not.toBeNull();
    expect(tree?.status).toBe('draft');
    expect(tree?.sections).toHaveLength(1);
    expect(tree?.sections[0]?.published).toBe(false);

    // An unknown id yields null (not a throw) so the gateway maps it to 404.
    expect(await pageService.getAdminTree(randomUUID())).toBeNull();
  });

  it('reorders sections within a page atomically (P7 builder, U21)', async () => {
    const page = await pageService.upsertPage({
      slug: 'services',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'خدماتنا', en: 'Services' },
    });
    const make = (order: number): Promise<{ id: string }> =>
      pageService.upsertSection({
        pageId: page.id,
        type: 'richtext',
        sortOrder: order,
        published: true,
        title: { ar: `قسم ${order}`, en: `Section ${order}` },
      });
    const a = await make(0);
    const b = await make(1);
    const c = await make(2);

    await pageService.reorderSections([c.id, a.id, b.id]);
    const tree = await pageService.getAdminTree(page.id);
    expect(tree?.sections.map((section) => section.id)).toEqual([
      c.id,
      a.id,
      b.id,
    ]);
  });

  it('persists a lead and emits a consumable lead.created via the Outbox (MS3, the Done-when)', async () => {
    const { id } = await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'We need an LMS.',
      source: 'contact',
      locale: 'ar',
    });
    expect(id).toBeDefined();

    const events = await db.execute(
      sql`select payload from "outbox" where event_name = 'lead.created'`,
    );
    expect(events.rowCount).toBe(1);
    // The outbox stores the payload as `text` — parse it exactly as the relay's consumer would.
    const raw: unknown = JSON.parse(String(events.rows[0]?.['payload']));
    expect(leadCreatedEventSchema.parse(raw).phone).toBe('+966501234567');

    const listed = await leadService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
    });
    const persisted = listed.items.find((lead) => lead.id === id);
    expect(persisted?.phone).toBe('+966501234567');
  });

  it('finds a lead by phone number from the inbox search bar (P8.10.B1)', async () => {
    await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'We need an LMS.',
      source: 'contact',
      locale: 'ar',
    });
    const found = await leadService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      search: '501234567',
    });
    expect(found.items).toHaveLength(1);
    expect(found.items[0]?.phone).toBe('+966501234567');
  });

  it('folds a repeat from the same EMAIL into the existing lead (the Done-when)', async () => {
    const first = await submit({
      name: 'Layla',
      email: 'Layla@Example.com',
      phone: '+966501234567',
      message: 'We need an LMS.',
      source: 'contact',
      locale: 'ar',
    });
    const second = await submit({
      name: 'Layla',
      // Case differs on purpose — a person is not two people because they held shift.
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'Actually, budget is 500k.',
      source: 'request-project',
      locale: 'ar',
    });
    expect(second.id).toBe(first.id);

    const rows = await db.execute(sql`select * from "lead"`);
    expect(rows.rowCount).toBe(1);
    expect(rows.rows[0]?.['submission_count']).toBe(2);
    // The original message stands — the team's reply thread must not be rewritten under them.
    expect(rows.rows[0]?.['message']).toBe('We need an LMS.');

    const audit = await db.execute(
      sql`select * from "audit_log" order by "occurred_at"`,
    );
    expect(audit.rows.map((r) => r['action'])).toEqual([
      'lead.submitted',
      'lead.resubmitted',
    ]);
    const repeat = audit.rows[1];
    expect(repeat?.['entity_id']).toBe(first.id);
    expect(repeat?.['actor_type']).toBe('anonymous');
    expect(repeat?.['ip']).toBe('85.10.1.4');
    expect(repeat?.['request_id']).toBe('req-b2');
    // The words that exist nowhere else survive here.
    expect(JSON.stringify(repeat?.['after'])).toContain(
      'Actually, budget is 500k.',
    );

    const events = await db.execute(
      sql`select payload from "outbox" where event_name = 'lead.resubmitted'`,
    );
    expect(events.rowCount).toBe(1);
    const payload: unknown = JSON.parse(String(events.rows[0]?.['payload']));
    const parsed = leadResubmittedEventSchema.parse(payload);
    expect(parsed.submissionCount).toBe(2);
    expect(parsed.message).toBe('Actually, budget is 500k.');
  });

  /**
   * A race detector has to be reliable, not lucky. Two concurrent submits collide often enough
   * to pass by accident with the lock REMOVED, so each race runs several rounds of several
   * concurrent submits and asserts on every round — verified by mutation: delete the advisory
   * lock and these fail every time.
   */
  const RACE_ROUNDS = 5;
  const RACE_CONCURRENCY = 4;

  async function raceSubmissions(
    bodies: Parameters<typeof leadService.submit>[0][],
  ): Promise<number> {
    await db.execute(sql`truncate table "lead" restart identity cascade`);
    await db.execute(sql.raw(auditTestResetSql()));
    await Promise.all(bodies.map((body) => submit(body)));
    const rows = await db.execute(sql`select id from "lead"`);
    return rows.rowCount ?? 0;
  }

  it('folds concurrent FIRST submissions on the same email (U30a — the lock, not luck)', async () => {
    const body = {
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'Simultaneous.',
      source: 'contact' as const,
      locale: 'ar' as const,
    };
    for (let round = 0; round < RACE_ROUNDS; round += 1) {
      const leads = await raceSubmissions(
        Array.from({ length: RACE_CONCURRENCY }, () => body),
      );
      expect(leads, `round ${String(round)}`).toBe(1);
    }
  });

  it('folds concurrent FIRST submissions that share only a PHONE', async () => {
    // The match is `email OR phone`, so the lock must cover BOTH — locking the email alone
    // gives these four submissions four different keys and four lead rows.
    for (let round = 0; round < RACE_ROUNDS; round += 1) {
      const leads = await raceSubmissions(
        Array.from({ length: RACE_CONCURRENCY }, (_unused, i) => ({
          name: 'Layla',
          email: `layla+${String(i)}@example.com`,
          phone: '+966501234567',
          message: 'Simultaneous.',
          source: 'contact' as const,
          locale: 'ar' as const,
        })),
      );
      expect(leads, `round ${String(round)}`).toBe(1);
    }
  });

  it('folds on a matching PHONE even when the email differs', async () => {
    const first = await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'First.',
      source: 'contact',
      locale: 'ar',
    });
    const second = await submit({
      name: 'Layla',
      email: 'layla.work@example.com',
      phone: '+966501234567',
      message: 'Second.',
      source: 'contact',
      locale: 'ar',
    });
    expect(second.id).toBe(first.id);
  });

  it('does NOT fold once the window has passed', async () => {
    dedupSettings = { enabled: true, windowSeconds: 60 };
    const first = await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'First.',
      source: 'contact',
      locale: 'ar',
    });
    // Age the first submission past the window.
    await db.execute(
      sql`update "lead" set "last_submitted_at" = now() - interval '10 minutes'`,
    );
    const second = await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'Second.',
      source: 'contact',
      locale: 'ar',
    });
    expect(second.id).not.toBe(first.id);
    const rows = await db.execute(sql`select id from "lead"`);
    expect(rows.rowCount).toBe(2);
  });

  it('does NOT fold into an ARCHIVED lead — the team closed that thread', async () => {
    const first = await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'First.',
      source: 'contact',
      locale: 'ar',
    });
    await leadService.updateStatus({ id: first.id, status: 'archived' });
    const second = await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'Second.',
      source: 'contact',
      locale: 'ar',
    });
    expect(second.id).not.toBe(first.id);
  });

  it('creates every time when an operator turns detection off', async () => {
    dedupSettings = { enabled: false, windowSeconds: 86_400 };
    const first = await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'First.',
      source: 'contact',
      locale: 'ar',
    });
    const second = await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'Second.',
      source: 'contact',
      locale: 'ar',
    });
    expect(second.id).not.toBe(first.id);
  });

  // ── P8.10.B3 — spam scoring ────────────────────────────────────────────────────────────
  // Everything here must stay ADVISORY: a score changes what the inbox shows, never whether a
  // lead exists. Each case asserts the row is still there.

  const spamBlast = {
    name: 'seo-master https://cheap.example',
    email: 'bot@example.com',
    phone: '+966500000001',
    message:
      'CHEAP SEO BACKLINKS AND GUEST POST!!!! BUY NOW https://a.example https://b.example https://c.example',
    source: 'contact',
    locale: 'en',
  } as const;

  const genuine = {
    name: 'ريما القحطاني',
    email: 'reema@example.com',
    phone: '+966500000002',
    message:
      'السلام عليكم، نبحث عن شريك تقني لبناء منصة حجوزات لفروعنا في الرياض. هل يمكننا ترتيب اجتماع الأسبوع القادم؟',
    source: 'contact',
    locale: 'ar',
  } as const;

  async function leadById(id: string): Promise<Lead | undefined> {
    const listed = await leadService.list({
      page: 1,
      pageSize: 50,
      order: 'asc',
    });
    return listed.items.find((lead) => lead.id === id);
  }

  it('scores a spam blast and stores the signals that produced it (P8.10.B3)', async () => {
    const { id } = await submit(spamBlast);

    const persisted = await leadById(id);
    expect(persisted?.spamScore).toBeGreaterThanOrEqual(
      LEAD_SPAM_BANDS.likelySpam.min,
    );
    expect(persisted?.spamSignals.map((signal) => signal.id)).toContain(
      'keywords',
    );
    // Advisory, always: the lead was still captured in full.
    expect(persisted?.message).toBe(spamBlast.message);
    const rows = await db.execute(sql`select id from "lead"`);
    expect(rows.rowCount).toBe(1);
  });

  it('leaves a genuine Arabic enquiry at zero, with no signals at all', async () => {
    const { id } = await submit(genuine);
    const persisted = await leadById(id);
    expect(persisted?.spamScore).toBe(0);
    expect(persisted?.spamSignals).toEqual([]);
  });

  it('records the score on the create audit row — the forensic trail (P8.8)', async () => {
    await submit(spamBlast);
    const rows = await db.execute(
      sql`select "after" from "audit_log" where action = 'lead.submitted'`,
    );
    const after = rows.rows[0]?.['after'] as Record<string, unknown>;
    expect(after['spamScore']).toBeGreaterThan(0);
  });

  it('takes the HIGHER score when a repeat is folded in, and keeps its signals', async () => {
    const first = await submit({
      ...genuine,
      message: 'نحتاج منصة حجوزات لفروعنا الخمسة.',
    });
    expect((await leadById(first.id))?.spamScore).toBe(0);

    const second = await submit({ ...genuine, message: spamBlast.message });
    expect(second.id).toBe(first.id);

    const folded = await leadById(first.id);
    expect(folded?.submissionCount).toBe(2);
    expect(folded?.spamScore).toBeGreaterThanOrEqual(
      LEAD_SPAM_BANDS.likelySpam.min,
    );
    expect(folded?.spamSignals.map((signal) => signal.id)).toContain(
      'keywords',
    );
  });

  it('never LOWERS a score when a clean repeat follows a spammy first message', async () => {
    const first = await submit({ ...spamBlast, name: 'Bot' });
    const scored = (await leadById(first.id))?.spamScore ?? 0;

    const second = await submit({
      ...spamBlast,
      name: 'Bot',
      message:
        'Apologies for the earlier message. We would like to discuss a booking platform for our stores.',
    });
    expect(second.id).toBe(first.id);
    expect((await leadById(first.id))?.spamScore).toBe(scored);
  });

  it('filters the inbox by verdict, translating the band into a score range (N7)', async () => {
    const spam = await submit(spamBlast);
    const clean = await submit(genuine);

    const flagged = await leadService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      spam: 'likelySpam',
    });
    expect(flagged.items.map((lead) => lead.id)).toEqual([spam.id]);

    const quiet = await leadService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      spam: 'clean',
    });
    expect(quiet.items.map((lead) => lead.id)).toEqual([clean.id]);
  });

  it('reads a lead captured before B3 as clean, so no old row is stranded by the filter', async () => {
    const { id } = await submit(genuine);
    // Exactly what the migration left behind on an existing row.
    await db.execute(
      sql`update "lead" set "spam_score" = default, "spam_signals" = default where id = ${id}`,
    );
    const quiet = await leadService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
      spam: 'clean',
    });
    expect(quiet.items.map((lead) => lead.id)).toContain(id);
  });

  it('sorts the inbox by spam score so a flood can be triaged from the top', async () => {
    const clean = await submit(genuine);
    const spam = await submit(spamBlast);

    const sorted = await leadService.list({
      page: 1,
      pageSize: 20,
      sort: 'spamScore',
      order: 'desc',
    });
    expect(sorted.items.map((lead) => lead.id)).toEqual([spam.id, clean.id]);
  });

  it('keeps the audit trail append-only, even against a direct statement (P8.8)', async () => {
    await submit({
      name: 'Layla',
      email: 'layla@example.com',
      phone: '+966501234567',
      message: 'First.',
      source: 'contact',
      locale: 'ar',
    });
    await expect(
      db.execute(sql`update "audit_log" set "action" = 'tampered'`),
    ).rejects.toThrow();
    await expect(db.execute(sql`delete from "audit_log"`)).rejects.toThrow();
    await expect(db.execute(sql`truncate table "audit_log"`)).rejects.toThrow();
  });

  it('reconciles media.deleted by nulling references, idempotently (MS6)', async () => {
    const mediaId = randomUUID();
    const service = await serviceService.create({
      slug: 'with-cover',
      category: 'core',
      sortOrder: 0,
      coverMediaId: mediaId,
      title: { ar: 'خدمة', en: 'Service' },
    });
    const page = await pageService.upsertPage({
      slug: 'home',
      status: 'published',
      sortOrder: 0,
      title: { ar: 'الرئيسية', en: 'Home' },
    });
    const section = await pageService.upsertSection({
      pageId: page.id,
      type: 'hero',
      sortOrder: 0,
      published: true,
    });
    const block = await pageService.upsertBlock({
      sectionId: section.id,
      type: 'image',
      sortOrder: 0,
      data: {},
      imageMediaId: mediaId,
    });

    await reconcile.reconcile({ id: mediaId, key: 'uploads/x.png' });

    const serviceRow = await db
      .select()
      .from(serviceTable)
      .where(eq(serviceTable.id, service.id));
    expect(serviceRow[0]?.coverMediaId).toBeNull();
    const blockRow = await db
      .select()
      .from(blockTable)
      .where(eq(blockTable.id, block.id));
    expect(blockRow[0]?.imageMediaId).toBeNull();

    // Redelivery is a safe no-op (idempotency ledger has exactly one row).
    await reconcile.reconcile({ id: mediaId, key: 'uploads/x.png' });
    const ledger = await db.execute(
      sql`select count(*)::int as n from "processed_message" where message_id = ${mediaId}`,
    );
    expect((ledger.rows[0] as { n: number }).n).toBe(1);
  });

  it('reorder renumbers sortOrder atomically to the given id order (U21)', async () => {
    const a = await blogTagService.create({
      slug: 'tag-a',
      sortOrder: 0,
      name: { ar: 'أ', en: 'A' },
    });
    const b = await blogTagService.create({
      slug: 'tag-b',
      sortOrder: 1,
      name: { ar: 'ب', en: 'B' },
    });
    const c = await blogTagService.create({
      slug: 'tag-c',
      sortOrder: 2,
      name: { ar: 'ج', en: 'C' },
    });

    // Drag into the order [c, a, b] → sortOrder 0/1/2 by index.
    await blogTagService.reorder([c.id, a.id, b.id]);
    const byId = new Map(
      (await blogTags.findByIds([a.id, b.id, c.id])).map((row) => [
        row.id,
        row.sortOrder,
      ]),
    );
    expect(byId.get(c.id)).toBe(0);
    expect(byId.get(a.id)).toBe(1);
    expect(byId.get(b.id)).toBe(2);

    // An id not in the table is simply ignored — the present rows still renumber.
    await blogTagService.reorder([b.id, randomUUID(), a.id, c.id]);
    const after = new Map(
      (await blogTags.findByIds([a.id, b.id, c.id])).map((row) => [
        row.id,
        row.sortOrder,
      ]),
    );
    expect(after.get(b.id)).toBe(0);
    expect(after.get(a.id)).toBe(2);
    expect(after.get(c.id)).toBe(3);
  });
});
