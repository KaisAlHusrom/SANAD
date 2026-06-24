import { Inject, Injectable } from '@nestjs/common';
import {
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { Paginated, TestimonialListQuery } from '@sanad/contracts';
import {
  testimonialTable,
  testimonialTranslationTable,
  type ContentDb,
  type TestimonialRow,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { testimonialModelConfig } from '../model-configs/testimonial.model-config.js';

/**
 * Whitelisted testimonial list filters (N7): free-text search across the translatable
 * `quote`/`authorRole` (any locale) + an exact `featured` flag. Never raw column passthrough.
 */
const TESTIMONIAL_FILTERS: FilterSpec = {
  search: {
    kind: 'search',
    columns: [],
    translatableFields: ['quote', 'authorRole'],
  },
  featured: { kind: 'column', field: 'featured', op: 'eq' },
};

/**
 * Testimonial persistence (N1) on the translatable base. Owns base-row CRUD + the whitelisted
 * list; quote/authorRole/companyDescriptor are translatable (N5). No slug (list-only).
 */
@Injectable()
export class TestimonialRepository extends LocalizedRepository<
  typeof testimonialTable,
  typeof testimonialTranslationTable,
  TestimonialRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, testimonialModelConfig, testimonialTranslationTable);
  }

  /** A paginated, searchable, featured-filterable list of live testimonials (base rows). */
  list(query: TestimonialListQuery): Promise<Paginated<TestimonialRow>> {
    return this.listFiltered(
      { search: query.search, featured: query.featured },
      TESTIMONIAL_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
