import { Injectable } from '@nestjs/common';
import type {
  BrandingRecord,
  BrandingUpdateRequest,
  ResolveScope,
} from '@sanad/contracts';
import { RedisCache } from '@sanad/cache';
import { assembleBranding } from './branding.assembler.js';
import { BRANDING_GROUP } from './branding-catalog.js';
import {
  BRANDING_CACHE_TTL_SECONDS,
  BRANDING_VERSION_KEY,
  brandingCacheKey,
} from './branding.constants.js';
import { flattenBrandingUpdate } from './branding-update.flatten.js';
import { SettingsResolver } from './settings.resolver.js';
import { SettingsWriter } from './settings/settings.writer.js';

/**
 * Branding reads + writes (the settings-service's first concrete group). Reads resolve the
 * `branding` group and assemble a complete `BrandingRecord` (coded defaults when unset, F7),
 * cached in Redis under a version key. Writes flatten the deep-partial update into per-key
 * writes and **delegate to {@link SettingsWriter}** — which persists the values + a
 * `settings.changed` Outbox event in one transaction (MS3) and bumps the version key, so the
 * write path is generic and this service holds no `DRIZZLE` handle (N14-clean).
 */
@Injectable()
export class BrandingService {
  constructor(
    private readonly resolver: SettingsResolver,
    private readonly cache: RedisCache,
    private readonly writer: SettingsWriter,
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

  /** Apply a partial branding update via the generic writer, then return the fresh record. */
  async updateBranding(
    body: BrandingUpdateRequest,
    ctx: ResolveScope,
  ): Promise<BrandingRecord> {
    const writes = flattenBrandingUpdate(body).map((write) => ({
      key: write.key,
      value: write.value,
    }));
    await this.writer.setMany(writes, ctx);
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
