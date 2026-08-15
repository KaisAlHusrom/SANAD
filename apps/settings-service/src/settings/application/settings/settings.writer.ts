import { Injectable } from '@nestjs/common';
import { AuditRecorder } from '@sanad/audit';
import { RedisCache } from '@sanad/cache';
import { DateTimeService, TransactionRunner } from '@sanad/database';
import { createOutboxRecord, DrizzleOutboxStore } from '@sanad/messaging';
import {
  SETTINGS_CHANGED_EVENT,
  type ResolveScope,
  type SettingsChangedEvent,
  type SettingWrite,
} from '@sanad/contracts';
import type { SettingRow } from '../../../db/schema/index.js';
import { SettingRepository } from '../../infrastructure/setting.repository.js';
import { SettingValueRepository } from '../../infrastructure/setting-value.repository.js';
import { SettingTranslationRepository } from '../../infrastructure/setting-translation.repository.js';
import { settingsVersionKey } from '../branding.constants.js';
import { isLocalizedText, type ResolvedValue } from '../resolved-value.js';
import { assertValidSettingValue } from '../settings-value.validate.js';
import { SettingsResolver } from '../settings.resolver.js';

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
    private readonly resolver: SettingsResolver,
    private readonly audit: AuditRecorder,
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

    // Read the CURRENT values before the write, so the trail records what actually moved
    // rather than just what was submitted (P8.8). Resolution is the same path a reader uses,
    // so a value that was only ever a coded default is recorded as such.
    const before = new Map<string, ResolvedValue>();
    for (const { setting } of planned) {
      before.set(setting.key, await this.resolver.resolveKey(setting.key, ctx));
    }

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
      // Same transaction as the value write and the event: a rolled-back settings change
      // leaves no audit row claiming it happened, and a committed one can never lack its row.
      for (const { setting, value } of planned) {
        await this.audit.recordWithin(txExec, {
          action: 'settings.updated',
          entityType: 'setting',
          entityId: setting.key,
          before: { value: before.get(setting.key) ?? null, scope, scopeId },
          after: { value, scope, scopeId },
        });
      }

      const outbox = new DrizzleOutboxStore(txExec, this.clock);
      for (const group of groups) {
        const event: SettingsChangedEvent = { group, scope, scopeId };
        await outbox.enqueue(
          createOutboxRecord(
            SETTINGS_CHANGED_EVENT,
            event,
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
