import { Inject, Injectable } from '@nestjs/common';
import type {
  BrandingRecord,
  BrandingUpdateRequest,
  ResolveScope,
} from '@sanad/contracts';
import { RedisCache } from '@sanad/cache';
// eslint-disable-next-line no-restricted-imports -- TODO(N14): grandfathered pre-rule; refactor to a TransactionRunner port (db belongs only in repositories).
import { DateTimeService, DRIZZLE } from '@sanad/database';
import { createOutboxRecord, DrizzleOutboxStore } from '@sanad/messaging';
import { SETTINGS_CHANGED_EVENT } from '@sanad/contracts';
import type { SettingsDb } from '../../db/schema/index.js';
import { SettingRepository } from '../infrastructure/setting.repository.js';
import { SettingValueRepository } from '../infrastructure/setting-value.repository.js';
import { SettingTranslationRepository } from '../infrastructure/setting-translation.repository.js';
import { assembleBranding } from './branding.assembler.js';
import { BRANDING_GROUP } from './branding-catalog.js';
import {
  BRANDING_CACHE_TTL_SECONDS,
  BRANDING_VERSION_KEY,
  brandingCacheKey,
} from './branding.constants.js';
import { flattenBrandingUpdate } from './branding-update.flatten.js';
import { isLocalizedText } from './resolved-value.js';
import { SettingsResolver } from './settings.resolver.js';

/**
 * Branding reads + writes (the settings-service's first concrete group). Reads resolve
 * the `branding` group and assemble a complete `BrandingRecord` (coded defaults when
 * unset, F7), cached in Redis under a version key. A write persists the values + a
 * `settings.changed` outbox event in ONE transaction (MS3), then bumps the version key
 * so the next read recomputes (the website P8 subscribes to the event to revalidate).
 */
@Injectable()
export class BrandingService {
  constructor(
    private readonly resolver: SettingsResolver,
    private readonly settings: SettingRepository,
    private readonly values: SettingValueRepository,
    private readonly translations: SettingTranslationRepository,
    private readonly cache: RedisCache,
    private readonly clock: DateTimeService,
    @Inject(DRIZZLE) private readonly db: SettingsDb,
  ) {}

  /** Resolve + assemble the branding record (global scope is cached). */
  async getBranding(ctx: ResolveScope): Promise<BrandingRecord> {
    if (ctx.scope !== 'global') {
      return this.resolveBranding(ctx);
    }
    const version = await this.currentVersion();
    const cacheKey = brandingCacheKey(version);
    const cached = await this.cache.get<BrandingRecord>(cacheKey);
    if (cached) {
      return cached;
    }
    const record = await this.resolveBranding(ctx);
    await this.cache.set(cacheKey, record, BRANDING_CACHE_TTL_SECONDS);
    return record;
  }

  /** Apply a partial branding update, emit `settings.changed`, bust the cache. */
  async updateBranding(
    body: BrandingUpdateRequest,
    ctx: ResolveScope,
  ): Promise<BrandingRecord> {
    const writes = flattenBrandingUpdate(body);
    const catalog = await this.settings.findByGroup(BRANDING_GROUP);
    const byKey = new Map(catalog.map((setting) => [setting.key, setting]));
    const scope = ctx.scope;
    const scopeId = scope === 'global' ? null : (ctx.scopeId ?? null);

    await this.db.transaction(async (tx) => {
      for (const write of writes) {
        const setting = byKey.get(write.key);
        if (!setting) {
          continue; // not a known catalog key — ignore
        }
        const scalar = isLocalizedText(write.value) ? null : write.value;
        const valueRow = await this.values.upsert(
          tx,
          setting.id,
          scope,
          scopeId,
          scalar,
        );
        if (write.type === 'localized_text' && isLocalizedText(write.value)) {
          await this.translations.upsert(tx, valueRow.id, 'ar', write.value.ar);
          await this.translations.upsert(tx, valueRow.id, 'en', write.value.en);
        }
      }
      const outbox = new DrizzleOutboxStore(tx, this.clock);
      await outbox.enqueue(
        createOutboxRecord(
          SETTINGS_CHANGED_EVENT,
          { group: BRANDING_GROUP, scope },
          this.clock.nowIso(),
        ),
      );
    });

    await this.cache.incr(BRANDING_VERSION_KEY);
    return this.getBranding(ctx);
  }

  private async resolveBranding(ctx: ResolveScope): Promise<BrandingRecord> {
    const resolved = await this.resolver.resolveGroup(BRANDING_GROUP, ctx);
    return assembleBranding(resolved);
  }

  private async currentVersion(): Promise<number> {
    const version = await this.cache.get<number>(BRANDING_VERSION_KEY);
    return version ?? 0;
  }
}
