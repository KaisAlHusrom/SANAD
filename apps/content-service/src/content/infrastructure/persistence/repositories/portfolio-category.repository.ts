import { Inject, Injectable } from '@nestjs/common';
import {
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { Paginated, PortfolioCategoryListQuery } from '@sanad/contracts';
import {
  portfolioCategoryTable,
  portfolioCategoryTranslationTable,
  type ContentDb,
  type PortfolioCategoryRow,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { portfolioCategoryModelConfig } from '../model-configs/portfolio-category.model-config.js';

/** Whitelisted portfolio-category list filters (N7): free-text search across the translatable `name`. */
const PORTFOLIO_CATEGORY_FILTERS: FilterSpec = {
  search: { kind: 'search', columns: [], translatableFields: ['name'] },
};

/**
 * Portfolio-category persistence (N1) on the translatable base. Owns base-row CRUD + the
 * whitelisted list + slug lookup + a batch id lookup (for the project embed); `name` is
 * translatable (N5).
 */
@Injectable()
export class PortfolioCategoryRepository extends LocalizedRepository<
  typeof portfolioCategoryTable,
  typeof portfolioCategoryTranslationTable,
  PortfolioCategoryRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(
      db,
      dateTime,
      portfolioCategoryModelConfig,
      portfolioCategoryTranslationTable,
    );
  }

  /** A live portfolio category by its unique slug, or null. */
  findBySlug(slug: string): Promise<PortfolioCategoryRow | null> {
    return this.where('slug', 'eq', slug).first();
  }

  /** Live categories for a set of ids (the project embed; caller maps by id). */
  findByIds(ids: readonly string[]): Promise<PortfolioCategoryRow[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.whereIn('id', [...ids]).all();
  }

  /** A paginated, searchable list of live portfolio categories (base rows). */
  list(
    query: PortfolioCategoryListQuery,
  ): Promise<Paginated<PortfolioCategoryRow>> {
    return this.listFiltered(
      { search: query.search },
      PORTFOLIO_CATEGORY_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
