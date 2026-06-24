import { Inject, Injectable } from '@nestjs/common';
import { DateTimeService, DRIZZLE } from '@sanad/database';
import {
  sectionTable,
  sectionTranslationTable,
  type ContentDb,
  type SectionRow,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { sectionModelConfig } from '../model-configs/section.model-config.js';

/**
 * Section persistence (N1) on the translatable base. Owns base-row CRUD + the per-page
 * lookup; eyebrow/title/subtitle are translatable (N5).
 */
@Injectable()
export class SectionRepository extends LocalizedRepository<
  typeof sectionTable,
  typeof sectionTranslationTable,
  SectionRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, sectionModelConfig, sectionTranslationTable);
  }

  /** All live sections for a page (caller sorts by `sortOrder`). */
  listForPage(pageId: string): Promise<SectionRow[]> {
    return this.where('pageId', 'eq', pageId).all();
  }
}
