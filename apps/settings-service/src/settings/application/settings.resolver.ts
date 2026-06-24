import { Injectable } from '@nestjs/common';
import type { LocalizedText, ResolveScope } from '@sanad/contracts';
import type { SettingValueRow } from '../../db/schema/index.js';
import { SettingRepository } from '../infrastructure/setting.repository.js';
import { SettingValueRepository } from '../infrastructure/setting-value.repository.js';
import { SettingTranslationRepository } from '../infrastructure/setting-translation.repository.js';
import { SETTINGS_DEFAULTS } from './branding-catalog.js';
import { isLocalizedText, type ResolvedValue } from './resolved-value.js';

/**
 * The configuration resolution engine (U9). Resolves a key (or a whole group) with the
 * precedence **override(scope+scopeId) → global → coded default** (`SETTINGS_DEFAULTS`).
 * `localized_text` values assemble `{ ar, en }` with PER-LOCALE fallback to the coded
 * default, so a partially-translated override never renders a blank locale (F7). The
 * override path is wired but dormant in MVP (only `global` is populated).
 */
@Injectable()
export class SettingsResolver {
  constructor(
    private readonly settings: SettingRepository,
    private readonly values: SettingValueRepository,
    private readonly translations: SettingTranslationRepository,
  ) {}

  async resolveKey(key: string, ctx: ResolveScope): Promise<ResolvedValue> {
    const setting = await this.settings.findByKey(key);
    if (!setting) {
      return this.codedDefault(key);
    }
    const valueRow = await this.findValue(setting.id, ctx);
    if (!valueRow) {
      return this.codedDefault(key);
    }
    if (setting.type === 'localized_text') {
      const rows = await this.translations.findForValues([valueRow.id]);
      const byLocale = new Map<string, string>(
        rows.map((row) => [row.locale, row.value]),
      );
      return this.assembleLocalized(key, byLocale);
    }
    return valueRow.value ?? this.codedDefault(key);
  }

  async resolveGroup(
    group: string,
    ctx: ResolveScope,
  ): Promise<Record<string, ResolvedValue>> {
    const settings = await this.settings.findByGroup(group);
    if (settings.length === 0) {
      return {};
    }
    const ids = settings.map((setting) => setting.id);
    const globalRows = await this.values.findForSettings(ids, 'global', null);
    const overrideRows =
      ctx.scope !== 'global' && ctx.scopeId !== undefined
        ? await this.values.findForSettings(ids, ctx.scope, ctx.scopeId)
        : [];
    const chosen = this.chooseRows(ids, globalRows, overrideRows);

    const localizedValueIds = settings
      .filter((setting) => setting.type === 'localized_text')
      .map((setting) => chosen.get(setting.id)?.id)
      .filter((id): id is string => id !== undefined);
    const txRows = await this.translations.findForValues(localizedValueIds);
    const txByValue = new Map<string, Map<string, string>>();
    for (const row of txRows) {
      const byLocale =
        txByValue.get(row.settingValueId) ?? new Map<string, string>();
      byLocale.set(row.locale, row.value);
      txByValue.set(row.settingValueId, byLocale);
    }

    const result: Record<string, ResolvedValue> = {};
    for (const setting of settings) {
      const row = chosen.get(setting.id);
      if (!row) {
        continue; // unset → the assembler fills the coded default (F7)
      }
      if (setting.type === 'localized_text') {
        result[setting.key] = this.assembleLocalized(
          setting.key,
          txByValue.get(row.id) ?? new Map<string, string>(),
        );
      } else {
        result[setting.key] = row.value ?? this.codedDefault(setting.key);
      }
    }
    return result;
  }

  private async findValue(
    settingId: string,
    ctx: ResolveScope,
  ): Promise<SettingValueRow | null> {
    if (ctx.scope !== 'global' && ctx.scopeId !== undefined) {
      const override = await this.values.findOne(
        settingId,
        ctx.scope,
        ctx.scopeId,
      );
      if (override) {
        return override;
      }
    }
    return this.values.findOne(settingId, 'global', null);
  }

  private chooseRows(
    ids: readonly string[],
    globalRows: readonly SettingValueRow[],
    overrideRows: readonly SettingValueRow[],
  ): Map<string, SettingValueRow> {
    const byGlobal = new Map(globalRows.map((row) => [row.settingId, row]));
    const byOverride = new Map(overrideRows.map((row) => [row.settingId, row]));
    const chosen = new Map<string, SettingValueRow>();
    for (const id of ids) {
      const row = byOverride.get(id) ?? byGlobal.get(id);
      if (row) {
        chosen.set(id, row);
      }
    }
    return chosen;
  }

  private codedDefault(key: string): ResolvedValue {
    return SETTINGS_DEFAULTS[key] ?? null;
  }

  private assembleLocalized(
    key: string,
    byLocale: Map<string, string>,
  ): LocalizedText {
    const def = this.codedDefault(key);
    const fallback: LocalizedText = isLocalizedText(def)
      ? def
      : { ar: '', en: '' };
    const ar = byLocale.get('ar');
    const en = byLocale.get('en');
    return {
      ar: ar !== undefined && ar.length > 0 ? ar : fallback.ar,
      en: en !== undefined && en.length > 0 ? en : fallback.en,
    };
  }
}
