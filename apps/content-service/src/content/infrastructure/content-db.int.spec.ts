import 'reflect-metadata';
import { randomUUID } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { eq, sql } from 'drizzle-orm';
// pg is CJS — default-import the module object (named exports aren't ESM-exposed, N12).
import pg from 'pg';
import { DateTimeService } from '@sanad/database';
import {
  blockTable,
  schema,
  serviceTable,
  type ContentDb,
} from '../../db/schema/index.js';
import { BlogCategoryService } from '../application/services/blog-category.service.js';
import { BlogPostService } from '../application/services/blog-post.service.js';
import { BlogTagService } from '../application/services/blog-tag.service.js';
import { FaqService } from '../application/services/faq.service.js';
import { LeadService } from '../application/services/lead.service.js';
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

async function tryConnect(): Promise<pg.Pool | null> {
  const pool = new pg.Pool({
    connectionString: TEST_DB_URL,
    options: '-c timezone=UTC',
  });
  try {
    await pool.query('select 1');
    await migrate(drizzle(pool), { migrationsFolder: 'src/db/migrations' });
    return pool;
  } catch {
    await pool.end().catch(() => undefined);
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

  const pageService = new PageService(pages, sections, blocks);
  const serviceService = new ServiceService(services);
  const testimonialService = new TestimonialService(testimonials);
  const teamMemberService = new TeamMemberService(members);
  const faqService = new FaqService(faqs);
  const menuService = new MenuService(menus, menuItems);
  const portfolioCategoryService = new PortfolioCategoryService(
    portfolioCategories,
  );
  const portfolioProjectService = new PortfolioProjectService(
    portfolioProjects,
    portfolioCategories,
    clock,
  );
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
  const leadService = new LeadService(leads, clock, db);
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

  it('does not expose a draft page on the public tree read (WEB2)', async () => {
    await pageService.upsertPage({
      slug: 'secret',
      status: 'draft',
      sortOrder: 0,
      title: { ar: 'مسودة', en: 'Draft' },
    });
    expect(await pageService.getTree('secret')).toBeNull();
  });

  it('persists a lead and emits a consumable lead.created via the Outbox (MS3, the Done-when)', async () => {
    const { id } = await leadService.submit({
      name: 'Layla',
      email: 'layla@example.com',
      message: 'We need an LMS.',
      source: 'contact',
      locale: 'ar',
    });
    expect(id).toBeDefined();

    const events = await db.execute(
      sql`select payload from "outbox" where event_name = 'lead.created'`,
    );
    expect(events.rowCount).toBe(1);

    const listed = await leadService.list({
      page: 1,
      pageSize: 20,
      order: 'asc',
    });
    expect(listed.items.some((lead) => lead.id === id)).toBe(true);
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
});
