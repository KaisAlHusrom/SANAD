import { Inject, Injectable } from '@nestjs/common';
import {
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { BlogCategoryListQuery, Paginated } from '@sanad/contracts';
import {
  blogCategoryTable,
  blogCategoryTranslationTable,
  type BlogCategoryRow,
  type ContentDb,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { blogCategoryModelConfig } from '../model-configs/blog-category.model-config.js';

/** Whitelisted blog-category list filters (N7): free-text search across translatable `name`/`description`. */
const BLOG_CATEGORY_FILTERS: FilterSpec = {
  search: {
    kind: 'search',
    columns: [],
    translatableFields: ['name', 'description'],
  },
};

/**
 * Blog-category persistence (N1) on the translatable base. Owns base-row CRUD + the whitelisted
 * list + slug lookup + a batch id lookup (for the post embed); `name`/`description` are
 * translatable (N5).
 */
@Injectable()
export class BlogCategoryRepository extends LocalizedRepository<
  typeof blogCategoryTable,
  typeof blogCategoryTranslationTable,
  BlogCategoryRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, blogCategoryModelConfig, blogCategoryTranslationTable);
  }

  /** A live blog category by its unique slug, or null. */
  findBySlug(slug: string): Promise<BlogCategoryRow | null> {
    return this.where('slug', 'eq', slug).first();
  }

  /** Live categories for a set of ids (the post embed; caller maps by id). */
  findByIds(ids: readonly string[]): Promise<BlogCategoryRow[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.whereIn('id', [...ids]).all();
  }

  /** A paginated, searchable list of live blog categories (base rows). */
  list(query: BlogCategoryListQuery): Promise<Paginated<BlogCategoryRow>> {
    return this.listFiltered(
      { search: query.search },
      BLOG_CATEGORY_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
