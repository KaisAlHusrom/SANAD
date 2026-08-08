import { Inject, Injectable } from '@nestjs/common';
import {
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { BlogPostListQuery, Paginated } from '@sanad/contracts';
import {
  blogPostTable,
  blogPostTranslationTable,
  type BlogPostRow,
  type ContentDb,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { blogPostModelConfig } from '../model-configs/blog-post.model-config.js';

/**
 * Whitelisted blog-post list filters (N7): free-text search across the translatable
 * `title`/`excerpt` (any locale) + exact `categoryId`/`status`. The PUBLIC gateway route forces
 * `status=published` (N7 — never client-controllable on the public path). Tag-filtering is not a
 * column filter (it spans the M2M join) — deferred to a future enhancement.
 */
const BLOG_POST_FILTERS: FilterSpec = {
  search: {
    kind: 'search',
    columns: [],
    translatableFields: ['title', 'excerpt'],
  },
  categoryId: { kind: 'column', field: 'categoryId', op: 'eq' },
  status: { kind: 'column', field: 'status', op: 'eq' },
};

/**
 * Blog-post persistence (N1) on the translatable base. Owns base-row CRUD + the whitelisted list
 * + slug lookup; title/excerpt/body are translatable (N5). Tags are managed separately by
 * `BlogPostTagRepository` (the M2M join).
 */
@Injectable()
export class BlogPostRepository extends LocalizedRepository<
  typeof blogPostTable,
  typeof blogPostTranslationTable,
  BlogPostRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, blogPostModelConfig, blogPostTranslationTable);
  }

  /** A live post by its unique slug, or null. */
  findBySlug(slug: string): Promise<BlogPostRow | null> {
    return this.where('slug', 'eq', slug).first();
  }

  /** Live posts for a set of ids (the `picked` section hydration; caller maps by id). */
  findByIds(ids: readonly string[]): Promise<BlogPostRow[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.whereIn('id', [...ids]).all();
  }

  /** A paginated, searchable, category/status-filterable list of live posts (base rows). */
  list(query: BlogPostListQuery): Promise<Paginated<BlogPostRow>> {
    return this.listFiltered(
      {
        search: query.search,
        categoryId: query.categoryId,
        status: query.status,
      },
      BLOG_POST_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
