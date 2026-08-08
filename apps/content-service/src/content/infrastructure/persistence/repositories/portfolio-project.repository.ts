import { Inject, Injectable } from '@nestjs/common';
import {
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { Paginated, PortfolioListQuery } from '@sanad/contracts';
import {
  portfolioProjectTable,
  portfolioProjectTranslationTable,
  type ContentDb,
  type PortfolioProjectRow,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { portfolioProjectModelConfig } from '../model-configs/portfolio-project.model-config.js';

/**
 * Whitelisted portfolio-project list filters (N7): free-text search across the translatable
 * `title`/`summary` (any locale) + exact `categoryId`/`featured`/`status`. The PUBLIC gateway
 * route forces `status=published` (N7 — never client-controllable on the public path).
 */
const PORTFOLIO_FILTERS: FilterSpec = {
  search: {
    kind: 'search',
    columns: [],
    translatableFields: ['title', 'summary'],
  },
  categoryId: { kind: 'column', field: 'categoryId', op: 'eq' },
  featured: { kind: 'column', field: 'featured', op: 'eq' },
  status: { kind: 'column', field: 'status', op: 'eq' },
};

/**
 * Portfolio-project persistence (N1) on the translatable base. Owns base-row CRUD + the
 * whitelisted list + slug lookup; the case-study copy is translatable (N5).
 */
@Injectable()
export class PortfolioProjectRepository extends LocalizedRepository<
  typeof portfolioProjectTable,
  typeof portfolioProjectTranslationTable,
  PortfolioProjectRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(
      db,
      dateTime,
      portfolioProjectModelConfig,
      portfolioProjectTranslationTable,
    );
  }

  /** A live project by its unique slug, or null. */
  findBySlug(slug: string): Promise<PortfolioProjectRow | null> {
    return this.where('slug', 'eq', slug).first();
  }

  /** Live projects for a set of ids (the `picked` section hydration; caller maps by id). */
  findByIds(ids: readonly string[]): Promise<PortfolioProjectRow[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.whereIn('id', [...ids]).all();
  }

  /** A paginated, searchable, category/featured/status-filterable list of live projects. */
  list(query: PortfolioListQuery): Promise<Paginated<PortfolioProjectRow>> {
    return this.listFiltered(
      {
        search: query.search,
        categoryId: query.categoryId,
        featured: query.featured,
        status: query.status,
      },
      PORTFOLIO_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
