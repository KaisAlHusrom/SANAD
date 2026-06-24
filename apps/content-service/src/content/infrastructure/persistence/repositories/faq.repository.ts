import { Inject, Injectable } from '@nestjs/common';
import {
  DateTimeService,
  DRIZZLE,
  paginateArgsFromListQuery,
  type FilterSpec,
} from '@sanad/database';
import type { FaqListQuery, Paginated } from '@sanad/contracts';
import {
  faqTable,
  faqTranslationTable,
  type ContentDb,
  type FaqRow,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { faqModelConfig } from '../model-configs/faq.model-config.js';

/**
 * Whitelisted FAQ list filters (N7): free-text search across the translatable
 * `question`/`answer` (any locale) + an exact `category`. Never raw column passthrough.
 */
const FAQ_FILTERS: FilterSpec = {
  search: {
    kind: 'search',
    columns: [],
    translatableFields: ['question', 'answer'],
  },
  category: { kind: 'column', field: 'category', op: 'eq' },
};

/**
 * FAQ persistence (N1) on the translatable base. Owns base-row CRUD + the whitelisted list;
 * question/answer are translatable (N5). No slug (list-only).
 */
@Injectable()
export class FaqRepository extends LocalizedRepository<
  typeof faqTable,
  typeof faqTranslationTable,
  FaqRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, faqModelConfig, faqTranslationTable);
  }

  /** A paginated, searchable, category-filterable list of live FAQs (base rows). */
  list(query: FaqListQuery): Promise<Paginated<FaqRow>> {
    return this.listFiltered(
      { search: query.search, category: query.category },
      FAQ_FILTERS,
      paginateArgsFromListQuery(query),
    );
  }
}
