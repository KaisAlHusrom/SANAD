import { Injectable } from '@nestjs/common';
import { RedisCache } from '@sanad/cache';
import { DateTimeService, TransactionRunner } from '@sanad/database';
import { createOutboxRecord, DrizzleOutboxStore } from '@sanad/messaging';
import {
  SETTINGS_CHANGED_EVENT,
  type ResolveScope,
  type SettingWrite,
} from '@sanad/contracts';
import type { SettingRow } from '../../db/schema/index.js';
import { SettingRepository } from '../infrastructure/setting.repository.js';
import { SettingValueRepository } from '../infrastructure/setting-value.repository.js';
import { SettingTranslationRepository } from '../infrastructure/setting-translation.repository.js';
import { settingsVersionKey } from './branding.constants.js';
import { isLocalizedText } from './resolved-value.js';
import { assertValidSettingValue } from './settings-value.validate.js';

/**
 * The generic settings writer — the single value-write seam (U3). Validates each value
 * against its descriptor `type` (N7), then persists the values (+ per-locale translations
 * for `localized_text`) and one `settings.changed` Outbox event PER touched group in ONE
 * transaction via the injected `TransactionRunner` (N14 — never `DRIZZLE`), and bumps each
 * group's Redis version key so cached reads recompute (MS3). `BrandingService` delegates
 * here, so there is no duplicated write logic.
 */
@Injectable()
export class SettingsWriter {
  constructor(
    private readonly settings: SettingRepository,
    private readonly values: SettingValueRepository,
    private readonly translations: SettingTranslationRepository,
    private readonly cache: RedisCache,
    private readonly clock: DateTimeService,
    private readonly tx: TransactionRunner,
  ) {}

  async setMany(
    writes: readonly SettingWrite[],
    ctx: ResolveScope,
  ): Promise<void> {
    const scope = ctx.scope;
    const scopeId = scope === 'global' ? null : (ctx.scopeId ?? null);

    // Resolve each write to its catalog descriptor + validate BEFORE any write.
    const planned: { setting: SettingRow; value: SettingWrite['value'] }[] = [];
    for (const write of writes) {
      const setting = await this.settings.findByKey(write.key);
      if (!setting) {
        continue; // unknown catalog key — ignore (mirrors branding's tolerant flatten)
      }
      assertValidSettingValue(write.key, setting.type, write.value);
      planned.push({ setting, value: write.value });
    }
    if (planned.length === 0) {
      return;
    }
    const groups = [...new Set(planned.map((entry) => entry.setting.group))];

    await this.tx.run(async (txExec) => {
      for (const { setting, value } of planned) {
        const scalar = isLocalizedText(value) ? null : value;
        const valueRow = await this.values.upsert(
          txExec,
          setting.id,
          scope,
          scopeId,
          scalar,
        );
        if (setting.type === 'localized_text') {
          if (isLocalizedText(value)) {
            await this.translations.upsert(txExec, valueRow.id, 'ar', value.ar);
            await this.translations.upsert(txExec, valueRow.id, 'en', value.en);
          } else {
            // Cleared to null — drop the per-locale rows, otherwise the resolver would
            // re-assemble the old text over the cleared value (U9).
            await this.translations.deleteForValue(txExec, valueRow.id);
          }
        }
      }
      const outbox = new DrizzleOutboxStore(txExec, this.clock);
      for (const group of groups) {
        await outbox.enqueue(
          createOutboxRecord(
            SETTINGS_CHANGED_EVENT,
            { group, scope },
            this.clock.nowIso(),
          ),
        );
      }
    });

    for (const group of groups) {
      await this.cache.incr(settingsVersionKey(group));
    }
  }
}
