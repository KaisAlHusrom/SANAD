import { Inject, Injectable } from '@nestjs/common';
import { eq, inArray } from 'drizzle-orm';
import { DateTimeService, DRIZZLE } from '@sanad/database';
import type { Locale } from '@sanad/contracts';
import type { DbExecutor } from '../../db/executor.js';
import {
  settingTranslationTable,
  type SettingsDb,
  type SettingTranslationRow,
} from '../../db/schema/index.js';

/**
 * The per-locale text repository for `localized_text` setting values (N5). Reads
 * assemble `{ ar, en }`; `upsert` writes one row per (value, locale) on the caller's
 * executor (composes inside the update transaction, MS3). No BaseRepository here — the
 * table has a composite PK and no soft-delete/hidden columns.
 */
@Injectable()
export class SettingTranslationRepository {
  constructor(
    @Inject(DRIZZLE) private readonly db: SettingsDb,
    private readonly clock: DateTimeService,
  ) {}

  /** All translation rows for a set of setting values (bulk, avoids N+1). */
  async findForValues(
    valueIds: readonly string[],
  ): Promise<SettingTranslationRow[]> {
    if (valueIds.length === 0) {
      return [];
    }
    return this.db
      .select()
      .from(settingTranslationTable)
      .where(inArray(settingTranslationTable.settingValueId, [...valueIds]));
  }

  /** Insert or update one locale's text for a setting value. */
  async upsert(
    exec: DbExecutor,
    settingValueId: string,
    locale: Locale,
    value: string,
  ): Promise<void> {
    await exec
      .insert(settingTranslationTable)
      .values({ settingValueId, locale, value })
      .onConflictDoUpdate({
        target: [
          settingTranslationTable.settingValueId,
          settingTranslationTable.locale,
        ],
        set: { value, updatedAt: this.touchTimestamp() },
      });
  }

  /**
   * Drop every locale's text for a setting value — used when a `localized_text` setting is
   * CLEARED to null. Without this the rows would linger and the resolver would re-assemble
   * the old text over a cleared value (U9: a cleared setting must fall back to the coded
   * default). Runs on the caller's executor so it composes inside the write transaction.
   */
  async deleteForValue(
    exec: DbExecutor,
    settingValueId: string,
  ): Promise<void> {
    await exec
      .delete(settingTranslationTable)
      .where(eq(settingTranslationTable.settingValueId, settingValueId));
  }

  private touchTimestamp(): Date {
    return this.clock.now().toJSDate();
  }
}
