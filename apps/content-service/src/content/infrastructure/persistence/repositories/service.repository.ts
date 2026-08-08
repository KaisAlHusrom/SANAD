import { Inject, Injectable } from '@nestjs/common';
import {
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { Paginated, ServiceListQuery } from '@sanad/contracts';
import {
  serviceTable,
  serviceTranslationTable,
  type ContentDb,
  type ServiceRow,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { serviceModelConfig } from '../model-configs/service.model-config.js';

/**
 * Whitelisted service list filters (N7): free-text search across the translatable
 * `title`/`summary` (any locale, via `searchAcrossLocales`) + an exact `category`. Never
 * raw column passthrough.
 */
const SERVICE_FILTERS: FilterSpec = {
  search: {
    kind: 'search',
    columns: [],
    translatableFields: ['title', 'summary'],
  },
  category: { kind: 'column', field: 'category', op: 'eq' },
};

/**
 * Service persistence (N1) on the translatable base. Owns base-row CRUD + the whitelisted
 * list + slug lookup; title/summary/detailBody are translatable (N5).
 */
@Injectable()
export class ServiceRepository extends LocalizedRepository<
  typeof serviceTable,
  typeof serviceTranslationTable,
  ServiceRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, serviceModelConfig, serviceTranslationTable);
  }

  /** A live service by its unique slug, or null. */
  findBySlug(slug: string): Promise<ServiceRow | null> {
    return this.where('slug', 'eq', slug).first();
  }

  /** Live services for a set of ids (the `picked` section hydration; caller maps by id). */
  findByIds(ids: readonly string[]): Promise<ServiceRow[]> {
    if (ids.length === 0) {
      return Promise.resolve([]);
    }
    return this.whereIn('id', [...ids]).all();
  }

  /** A paginated, searchable, category-filterable list of live services (base rows). */
  list(query: ServiceListQuery): Promise<Paginated<ServiceRow>> {
    return this.listFiltered(
      { search: query.search, category: query.category },
      SERVICE_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
