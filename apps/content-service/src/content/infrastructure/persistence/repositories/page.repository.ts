import { Inject, Injectable } from '@nestjs/common';
import { DateTimeService, DRIZZLE, type PaginateArgs } from '@sanad/database';
import type { Paginated } from '@sanad/contracts';
import {
  pageTable,
  pageTranslationTable,
  type ContentDb,
  type PageRow,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { pageModelConfig } from '../model-configs/page.model-config.js';

/**
 * Page persistence (N1) on the translatable base. Owns base-row CRUD + slug lookup; the
 * translatable title/SEO meta are handled by the inherited `LocalizedRepository` (N5).
 */
@Injectable()
export class PageRepository extends LocalizedRepository<
  typeof pageTable,
  typeof pageTranslationTable,
  PageRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, pageModelConfig, pageTranslationTable);
  }

  /** A live page by its unique slug, or null. */
  findBySlug(slug: string): Promise<PageRow | null> {
    return this.where('slug', 'eq', slug).first();
  }

  /** The full live page list for the admin (P7), paginated. */
  list(args: PaginateArgs): Promise<Paginated<PageRow>> {
    return this.paginate(args);
  }
}
