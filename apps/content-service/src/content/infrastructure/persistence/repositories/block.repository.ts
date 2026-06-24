import { Inject, Injectable } from '@nestjs/common';
import { DateTimeService, DRIZZLE } from '@sanad/database';
import {
  blockTable,
  blockTranslationTable,
  type BlockRow,
  type ContentDb,
} from '../../../../db/schema/index.js';
import { LocalizedRepository } from './localized.repository.js';
import { blockModelConfig } from '../model-configs/block.model-config.js';

/**
 * Block persistence (N1) on the translatable base. Owns base-row CRUD + the per-section
 * lookup; title/body are translatable (N5), `data`/`imageMediaId` are base columns.
 */
@Injectable()
export class BlockRepository extends LocalizedRepository<
  typeof blockTable,
  typeof blockTranslationTable,
  BlockRow
> {
  constructor(@Inject(DRIZZLE) db: ContentDb, dateTime: DateTimeService) {
    super(db, dateTime, blockModelConfig, blockTranslationTable);
  }

  /** All live blocks across a set of sections (caller groups + sorts by `sortOrder`). */
  listForSections(sectionIds: readonly string[]): Promise<BlockRow[]> {
    if (sectionIds.length === 0) {
      return Promise.resolve([]);
    }
    return this.whereIn('sectionId', [...sectionIds]).all();
  }
}
