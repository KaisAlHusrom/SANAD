import { Inject, Injectable } from '@nestjs/common';
import {
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { BlogTagListQuery, Paginated } from '@sanad/contracts';
import {
  blogTagTable,
  blogTagTranslationTable,
  type BlogTagRow,
  type ContentDb,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { blogTagModelConfig } from '../model-configs/blog-tag.model-config.js';

/** Whitelisted blog-tag list filters (N7): free-text search across the translatable `name`. */
const BLOG_TAG_FILTERS: FilterSpec = {
  search: { kind: 'search', columns: [], translatableFields: ['name'] },
};

/**
 * Blog-tag persistence (N1) on the translatable base. Owns base-row CRUD + the whitelisted list
 * + slug lookup + a batch id lookup (for the post embed); `name` is translatable (N5).
 */
@Injectable()
export class BlogTagRepository extends LocalizedRepository<
  typeof blogTagTable,
  typeof blogTagTranslationTable,
  BlogTagRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, blogTagModelConfig, blogTagTranslationTable);
  }

  /** A live blog tag by its unique slug, or null. */
  findBySlug(slug: string): Promise<BlogTagRow | null> {
    return this.where('slug', 'eq', slug).first();
  }

  /** Live tags for a set of ids (the post embed; caller maps by id). */
  findByIds(ids: readonly string[]): Promise<BlogTagRow[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.whereIn('id', [...ids]).all();
  }

  /** A paginated, searchable list of live blog tags (base rows). */
  list(query: BlogTagListQuery): Promise<Paginated<BlogTagRow>> {
    return this.listFiltered(
      { search: query.search },
      BLOG_TAG_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
