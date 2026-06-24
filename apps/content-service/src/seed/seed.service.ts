import {
  Injectable,
  Logger,
  type OnApplicationBootstrap,
} from '@nestjs/common';
import { BlogCategoryService } from '../content/application/services/blog-category.service.js';
import { BlogPostService } from '../content/application/services/blog-post.service.js';
import { BlogTagService } from '../content/application/services/blog-tag.service.js';
import { FaqService } from '../content/application/services/faq.service.js';
import { MenuService } from '../content/application/services/menu.service.js';
import { PortfolioCategoryService } from '../content/application/services/portfolio-category.service.js';
import { PageService } from '../content/application/services/page.service.js';
import { ServiceService } from '../content/application/services/service.service.js';
import { TeamMemberService } from '../content/application/services/team-member.service.js';
import { TestimonialService } from '../content/application/services/testimonial.service.js';
import { BlogCategoryRepository } from '../content/infrastructure/persistence/repositories/blog-category.repository.js';
import { BlogPostRepository } from '../content/infrastructure/persistence/repositories/blog-post.repository.js';
import { BlogTagRepository } from '../content/infrastructure/persistence/repositories/blog-tag.repository.js';
import { FaqRepository } from '../content/infrastructure/persistence/repositories/faq.repository.js';
import { MenuRepository } from '../content/infrastructure/persistence/repositories/menu.repository.js';
import { PortfolioCategoryRepository } from '../content/infrastructure/persistence/repositories/portfolio-category.repository.js';
import { PageRepository } from '../content/infrastructure/persistence/repositories/page.repository.js';
import { ServiceRepository } from '../content/infrastructure/persistence/repositories/service.repository.js';
import { TeamMemberRepository } from '../content/infrastructure/persistence/repositories/team-member.repository.js';
import { TestimonialRepository } from '../content/infrastructure/persistence/repositories/testimonial.repository.js';
import {
  SEED_BLOG_CATEGORIES,
  SEED_BLOG_POSTS,
  SEED_BLOG_TAGS,
  SEED_FAQS,
  SEED_MENUS,
  SEED_PAGES,
  SEED_PORTFOLIO_CATEGORIES,
  SEED_SERVICES,
  SEED_TEAM_MEMBERS,
  SEED_TESTIMONIALS,
} from './seed-data.js';

const EMPTY = { ar: '', en: '' };

/**
 * Idempotently seeds the coded content defaults at boot (U9 / WEB1) so the website never
 * renders blank. Seeds a page tree / service only when it's ABSENT (keyed on slug) — safe to
 * run every start; it never overwrites admin edits. Richer re-sync is a P7 admin concern.
 */
@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly pages: PageRepository,
    private readonly services: ServiceRepository,
    private readonly testimonials: TestimonialRepository,
    private readonly members: TeamMemberRepository,
    private readonly faqs: FaqRepository,
    private readonly menus: MenuRepository,
    private readonly portfolioCategories: PortfolioCategoryRepository,
    private readonly blogCategories: BlogCategoryRepository,
    private readonly blogTags: BlogTagRepository,
    private readonly blogPosts: BlogPostRepository,
    private readonly pageService: PageService,
    private readonly serviceService: ServiceService,
    private readonly testimonialService: TestimonialService,
    private readonly teamMemberService: TeamMemberService,
    private readonly faqService: FaqService,
    private readonly menuService: MenuService,
    private readonly portfolioCategoryService: PortfolioCategoryService,
    private readonly blogCategoryService: BlogCategoryService,
    private readonly blogTagService: BlogTagService,
    private readonly blogPostService: BlogPostService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    let seededPages = 0;
    for (const [pageIndex, page] of SEED_PAGES.entries()) {
      if (await this.pages.findBySlug(page.slug)) {
        continue;
      }
      const created = await this.pageService.upsertPage({
        slug: page.slug,
        status: 'published',
        sortOrder: pageIndex,
        title: page.title,
        metaTitle: page.metaTitle ?? EMPTY,
        metaDescription: page.metaDescription ?? EMPTY,
      });
      for (const [sectionIndex, section] of page.sections.entries()) {
        const node = await this.pageService.upsertSection({
          pageId: created.id,
          type: section.type,
          sortOrder: sectionIndex,
          published: true,
          eyebrow: section.eyebrow ?? EMPTY,
          title: section.title ?? EMPTY,
          subtitle: section.subtitle ?? EMPTY,
        });
        for (const [blockIndex, block] of section.blocks.entries()) {
          await this.pageService.upsertBlock({
            sectionId: node.id,
            type: block.type,
            sortOrder: blockIndex,
            data: block.data ?? {},
            title: block.title ?? EMPTY,
            body: block.body ?? EMPTY,
          });
        }
      }
      seededPages += 1;
    }

    let seededServices = 0;
    for (const [index, service] of SEED_SERVICES.entries()) {
      if (await this.services.findBySlug(service.slug)) {
        continue;
      }
      await this.serviceService.create({
        slug: service.slug,
        category: service.category,
        iconKey: service.iconKey,
        sortOrder: index,
        title: service.title,
        summary: service.summary,
      });
      seededServices += 1;
    }

    // Testimonials have no natural key — seed only when the collection is empty (idempotent).
    let seededTestimonials = 0;
    if ((await this.testimonials.count()) === 0) {
      for (const [index, testimonial] of SEED_TESTIMONIALS.entries()) {
        await this.testimonialService.create({
          authorName: testimonial.authorName,
          companyName: testimonial.companyName,
          rating: testimonial.rating,
          featured: testimonial.featured,
          sortOrder: index,
          quote: testimonial.quote,
          authorRole: testimonial.authorRole,
          companyDescriptor: testimonial.companyDescriptor,
        });
        seededTestimonials += 1;
      }
    }

    let seededMembers = 0;
    for (const [index, member] of SEED_TEAM_MEMBERS.entries()) {
      if (await this.members.findBySlug(member.slug)) {
        continue;
      }
      await this.teamMemberService.create({
        slug: member.slug,
        featured: member.featured,
        sortOrder: index,
        name: member.name,
        role: member.role,
        bio: member.bio,
      });
      seededMembers += 1;
    }

    // FAQs have no natural key — seed only when the collection is empty (idempotent).
    let seededFaqs = 0;
    if ((await this.faqs.count()) === 0) {
      for (const [index, faq] of SEED_FAQS.entries()) {
        await this.faqService.create({
          category: faq.category,
          sortOrder: index,
          question: faq.question,
          answer: faq.answer,
        });
        seededFaqs += 1;
      }
    }

    let seededPortfolioCategories = 0;
    for (const [index, category] of SEED_PORTFOLIO_CATEGORIES.entries()) {
      if (await this.portfolioCategories.findBySlug(category.slug)) {
        continue;
      }
      await this.portfolioCategoryService.create({
        slug: category.slug,
        sortOrder: index,
        name: category.name,
      });
      seededPortfolioCategories += 1;
    }

    let seededMenus = 0;
    for (const [menuIndex, menu] of SEED_MENUS.entries()) {
      if (await this.menus.findByKey(menu.key)) {
        continue;
      }
      const created = await this.menuService.create({
        key: menu.key,
        sortOrder: menuIndex,
      });
      for (const [itemIndex, item] of menu.items.entries()) {
        await this.menuService.createItem({
          menuId: created.id,
          url: item.url,
          sortOrder: itemIndex,
          label: item.label,
        });
      }
      seededMenus += 1;
    }

    let seededBlogCategories = 0;
    for (const [index, category] of SEED_BLOG_CATEGORIES.entries()) {
      if (await this.blogCategories.findBySlug(category.slug)) {
        continue;
      }
      await this.blogCategoryService.create({
        slug: category.slug,
        sortOrder: index,
        name: category.name,
        description: category.description,
      });
      seededBlogCategories += 1;
    }

    let seededBlogTags = 0;
    for (const [index, tag] of SEED_BLOG_TAGS.entries()) {
      if (await this.blogTags.findBySlug(tag.slug)) {
        continue;
      }
      await this.blogTagService.create({
        slug: tag.slug,
        sortOrder: index,
        name: tag.name,
      });
      seededBlogTags += 1;
    }

    // Posts seed last — they reference the categories/tags/team seeded above (resolve slug → id).
    let seededBlogPosts = 0;
    for (const [index, post] of SEED_BLOG_POSTS.entries()) {
      if (await this.blogPosts.findBySlug(post.slug)) {
        continue;
      }
      const category = post.categorySlug
        ? await this.blogCategories.findBySlug(post.categorySlug)
        : null;
      const author = post.authorSlug
        ? await this.members.findBySlug(post.authorSlug)
        : null;
      const tagIds: string[] = [];
      for (const tagSlug of post.tagSlugs) {
        const tag = await this.blogTags.findBySlug(tagSlug);
        if (tag) {
          tagIds.push(tag.id);
        }
      }
      await this.blogPostService.create({
        slug: post.slug,
        categoryId: category?.id ?? null,
        authorTeamMemberId: author?.id ?? null,
        coverMediaId: null,
        status: post.status,
        readMinutes: post.readMinutes ?? null,
        sortOrder: index,
        tagIds,
        title: post.title,
        excerpt: post.excerpt,
        body: post.body,
      });
      seededBlogPosts += 1;
    }

    this.logger.log(
      `Content seed: ${seededPages} page(s) + ${seededServices} service(s) + ` +
        `${seededTestimonials} testimonial(s) + ${seededMembers} team member(s) + ` +
        `${seededFaqs} faq(s) + ${seededMenus} menu(s) + ` +
        `${seededPortfolioCategories} portfolio categor(ies) + ` +
        `${seededBlogCategories} blog categor(ies) + ${seededBlogTags} blog tag(s) + ` +
        `${seededBlogPosts} blog post(s) created (existing left untouched)`,
    );
  }
}
