import { Injectable } from '@nestjs/common';
import type {
  HydratedCollection,
  SectionCollectionConfig,
  SectionType,
} from '@sanad/contracts';
import { BlogPostService } from './blog-post.service.js';
import { FaqService } from './faq.service.js';
import { PortfolioProjectService } from './portfolio-project.service.js';
import { ServiceService } from './service.service.js';
import { TeamMemberService } from './team-member.service.js';
import { TestimonialService } from './testimonial.service.js';

/** How a hydrated read behaves — public reads (`publishedOnly`) hide drafts (WEB2). */
export interface HydrationOpts {
  publishedOnly: boolean;
}

/** Default record cap per collection when the section `config` sets no `limit` (mirrors the
 *  website's `getServices()`/`getPortfolio()` defaults so preview===live). */
const DEFAULT_LIMIT: Partial<Record<SectionType, number>> = {
  services: 8,
  // the website's `getPortfolio(6)` feeds today's trust constellation — match it so the
  // domains derived from the hydrated set are identical to the live landing (no regression).
  trust: 6,
  // the WEB10 works orbit also fed on `getPortfolio(6)` — same cap so the swap is a no-op count.
  work: 6,
  // today's landing shows 2 testimonials (the `.web-quote` grid) — default to that visible
  // count so the admin `limit` control is honest (renders exactly what it hydrates).
  testimonials: 2,
  // the landing blog teaser fed on `getBlogTeaser(3)` — match it (no regression).
  blog: 3,
  // the `/faq` accordion shows the full published set — cap generously so the admin `limit`
  // control is honest without truncating a modest FAQ list (Phase 5).
  faq: 8,
  // the `/about` roster shows the whole team — same generous cap (Phase 5).
  team: 8,
};

type Hydrator = (
  config: SectionCollectionConfig | null,
  opts: HydrationOpts,
) => Promise<HydratedCollection | null>;

/**
 * Hydrates a section's linked collection IN-SERVICE (same DB, no RMQ — MS5) from the
 * section's `config`, so the assembled `SectionNode.collection` carries the exact records
 * the website + the admin preview render (preview===live). The registry grows one collection
 * at a time as each collection-backed section is unified into `@sanad/web-ui` (services first
 * — MS9, non-speculative). Depends only on the collections' application services (service →
 * service, N14-clean) so each hydrator reuses the same row→`*Item` mapping the public list
 * endpoints use (single source of truth, U3).
 */
@Injectable()
export class CollectionHydrationService {
  constructor(
    private readonly services: ServiceService,
    private readonly portfolio: PortfolioProjectService,
    private readonly testimonials: TestimonialService,
    private readonly blog: BlogPostService,
    private readonly faq: FaqService,
    private readonly team: TeamMemberService,
  ) {}

  private readonly hydrators: Partial<Record<SectionType, Hydrator>> = {
    services: (config) => this.hydrateServices(config),
    // the trust chapter's domain constellation reads the `portfolio` collection (grouped by
    // category in the shared component) — the section TYPE is `trust`, the collection `portfolio`.
    trust: (config, opts) => this.hydratePortfolio(config, opts, 'trust'),
    // the WEB10 works orbit reads the `portfolio` collection as case-study cards — same
    // collection as trust, keyed on the `work` section type; offers featured/picked/all.
    work: (config, opts) => this.hydratePortfolio(config, opts, 'work'),
    // the testimonials wall reads the `testimonials` collection; offers featured/picked/all.
    testimonials: (config) => this.hydrateTestimonials(config),
    // the blog teaser reads the `blog` collection; offers picked/all (no featured flag).
    blog: (config, opts) => this.hydrateBlog(config, opts),
    // the `/faq` accordion reads the `faq` collection; offers all/picked (no featured flag).
    faq: (config) => this.hydrateFaq(config),
    // the `/about` roster reads the `team` collection; offers featured/picked/all.
    team: (config) => this.hydrateTeam(config),
  };

  /**
   * Hydrate a section's collection, or `null` when its type links no collection (or has no
   * hydrator yet). `config` null → the collection's own order, default cap.
   */
  hydrate(
    type: SectionType,
    config: SectionCollectionConfig | null,
    opts: HydrationOpts,
  ): Promise<HydratedCollection | null> {
    const hydrator = this.hydrators[type];
    return hydrator ? hydrator(config, opts) : Promise.resolve(null);
  }

  /**
   * Services hydration. `mode:'picked'` → exactly `ids` in order; otherwise (`all`/`featured`
   * — services carry no `featured` flag, so it falls back to `all`) the sortOrder list capped
   * at `limit`.
   */
  private async hydrateServices(
    config: SectionCollectionConfig | null,
  ): Promise<HydratedCollection> {
    if (config?.mode === 'picked') {
      return {
        collection: 'services',
        items: await this.services.listByIds(config.ids),
      };
    }
    const limit = config?.limit ?? DEFAULT_LIMIT.services ?? 8;
    // sortOrder ascending = the admin's drag order (W6) — a curated landing row.
    const page = await this.services.list({
      page: 1,
      pageSize: limit,
      order: 'asc',
      sort: 'sortOrder',
    });
    return { collection: 'services', items: page.items };
  }

  /**
   * Portfolio hydration, shared by `trust` (domain constellation) + `work` (case-study orbit).
   * `mode:'picked'` → exactly `ids` in order; `mode:'featured'` → only the `featured` projects
   * (the `work` orbit's curated reel; trust offers `all`-only so it never asks); `all`/default →
   * the sortOrder list capped at the type's `limit`. The public path forces `status:'published'`
   * so drafts never leak (WEB2) and the admin preview + live site derive from the same records.
   */
  private async hydratePortfolio(
    config: SectionCollectionConfig | null,
    opts: HydrationOpts,
    type: SectionType,
  ): Promise<HydratedCollection> {
    if (config?.mode === 'picked') {
      return {
        collection: 'portfolio',
        items: await this.portfolio.listByIds(config.ids),
      };
    }
    const limit = config?.limit ?? DEFAULT_LIMIT[type] ?? 6;
    const page = await this.portfolio.list({
      page: 1,
      pageSize: limit,
      order: 'asc',
      sort: 'sortOrder',
      // `featured` reel → only flagged projects; `all` → every project in the drag order.
      ...(config?.mode === 'featured' ? { featured: true } : {}),
      ...(opts.publishedOnly ? { status: 'published' as const } : {}),
    });
    return { collection: 'portfolio', items: page.items };
  }

  /**
   * Testimonials hydration (the received-transmissions wall). `mode:'picked'` → exactly `ids` in
   * order; `mode:'featured'` → only the flagged testimonials (the curated reel); `all`/default →
   * the sortOrder list capped at `limit`. Testimonials have no draft/status concept, so
   * `publishedOnly` is a no-op here.
   */
  private async hydrateTestimonials(
    config: SectionCollectionConfig | null,
  ): Promise<HydratedCollection> {
    if (config?.mode === 'picked') {
      return {
        collection: 'testimonials',
        items: await this.testimonials.listByIds(config.ids),
      };
    }
    const limit = config?.limit ?? DEFAULT_LIMIT.testimonials ?? 4;
    const page = await this.testimonials.list({
      page: 1,
      pageSize: limit,
      order: 'asc',
      sort: 'sortOrder',
      ...(config?.mode === 'featured' ? { featured: true } : {}),
    });
    return { collection: 'testimonials', items: page.items };
  }

  /**
   * Blog hydration (the ship's-log teaser). `mode:'picked'` → exactly `ids` in order; otherwise
   * (`all`/`featured` — blog posts carry no `featured` flag, so it falls back to `all`) the
   * sortOrder list capped at `limit`. The public path forces `status:'published'` so drafts never
   * leak (WEB2) and the admin preview + live site derive from the same records.
   */
  private async hydrateBlog(
    config: SectionCollectionConfig | null,
    opts: HydrationOpts,
  ): Promise<HydratedCollection> {
    if (config?.mode === 'picked') {
      return {
        collection: 'blog',
        items: await this.blog.listByIds(config.ids),
      };
    }
    const limit = config?.limit ?? DEFAULT_LIMIT.blog ?? 3;
    const page = await this.blog.list({
      page: 1,
      pageSize: limit,
      order: 'asc',
      sort: 'sortOrder',
      ...(opts.publishedOnly ? { status: 'published' as const } : {}),
    });
    return { collection: 'blog', items: page.items };
  }

  /**
   * FAQ hydration (the `/faq` accordion). `mode:'picked'` → exactly `ids` in order; otherwise
   * (`all`/`featured` — FAQs carry no `featured` flag, so it falls back to `all`) the sortOrder
   * list capped at `limit`. FAQs have no draft/status concept, so `publishedOnly` is a no-op.
   */
  private async hydrateFaq(
    config: SectionCollectionConfig | null,
  ): Promise<HydratedCollection> {
    if (config?.mode === 'picked') {
      return { collection: 'faq', items: await this.faq.listByIds(config.ids) };
    }
    const limit = config?.limit ?? DEFAULT_LIMIT.faq ?? 8;
    const page = await this.faq.list({
      page: 1,
      pageSize: limit,
      order: 'asc',
      sort: 'sortOrder',
    });
    return { collection: 'faq', items: page.items };
  }

  /**
   * Team hydration (the `/about` roster). `mode:'picked'` → exactly `ids` in order;
   * `mode:'featured'` → only the flagged members (a curated leadership set); `all`/default →
   * the sortOrder list capped at `limit`. Team members have no draft/status concept, so
   * `publishedOnly` is a no-op.
   */
  private async hydrateTeam(
    config: SectionCollectionConfig | null,
  ): Promise<HydratedCollection> {
    if (config?.mode === 'picked') {
      return {
        collection: 'team',
        items: await this.team.listByIds(config.ids),
      };
    }
    const limit = config?.limit ?? DEFAULT_LIMIT.team ?? 8;
    const page = await this.team.list({
      page: 1,
      pageSize: limit,
      order: 'asc',
      sort: 'sortOrder',
      ...(config?.mode === 'featured' ? { featured: true } : {}),
    });
    return { collection: 'team', items: page.items };
  }
}
