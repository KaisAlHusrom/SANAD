import { Inject, Injectable } from '@nestjs/common';
import { BaseRepository, DateTimeService, DRIZZLE } from '@sanad/database';
import type {
  SettingRequirement,
  SettingScope,
  SettingType,
} from '@sanad/contracts';
import {
  settingTable,
  type SettingRow,
  type SettingsDb,
  type SettingScalar,
} from '../../db/schema/index.js';
import { settingModelConfig } from './setting.model-config.js';

/** A catalog row to seed/upsert (idempotent). */
export interface SettingCatalogInput {
  key: string;
  group: string;
  type: SettingType;
  requirement: SettingRequirement;
  scope: SettingScope;
  options?: string[] | null;
  defaultValue?: SettingScalar | null;
}

/**
 * The setting **catalog** repository (N1) on the enhanced base. Reads use the fluent
 * builder; `ensureSetting` is the idempotent seed upsert (keyed on `key`).
 */
@Injectable()
export class SettingRepository extends BaseRepository<
  typeof settingTable,
  SettingRow
> {
  constructor(@Inject(DRIZZLE) db: SettingsDb, dateTime: DateTimeService) {
    super(db, dateTime, settingModelConfig);
  }

  findByKey(key: string): Promise<SettingRow | null> {
    return this.where('key', 'eq', key).first();
  }

  findByGroup(group: string): Promise<SettingRow[]> {
    return this.where('group', 'eq', group).all();
  }

  /** Idempotently insert or refresh a catalog row (seed-safe). */
  async ensureSetting(input: SettingCatalogInput): Promise<void> {
    await this.db
      .insert(settingTable)
      .values({
        key: input.key,
        group: input.group,
        type: input.type,
        requirement: input.requirement,
        scope: input.scope,
        options: input.options ?? null,
        defaultValue: input.defaultValue ?? null,
      })
      .onConflictDoUpdate({
        target: settingTable.key,
        set: {
          group: input.group,
          type: input.type,
          requirement: input.requirement,
          scope: input.scope,
          options: input.options ?? null,
          defaultValue: input.defaultValue ?? null,
          updatedAt: this.dateTime.now().toJSDate(),
        },
      });
  }
}
