import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { Audited } from '@sanad/audit';
import {
  resolveGroupRequestSchema,
  resolveRequestSchema,
  resolveScopeSchema,
  settingsUpdateRequestSchema,
  SETTINGS_CATALOG_GET,
  SETTINGS_RESOLVE,
  SETTINGS_RESOLVE_GROUP,
  SETTINGS_SET,
  type ResolveGroupRequest,
  type ResolveRequest,
  type ResolveScope,
  type SettingsCatalog,
  type SettingsUpdateRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import type { ResolvedValue } from '../../application/resolved-value.js';
import { SettingsCatalogService } from '../../application/settings-catalog.service.js';
import { SettingsResolver } from '../../application/settings.resolver.js';
import { SettingsWriter } from '../../application/settings/settings.writer.js';

/**
 * RMQ entrypoints for generic settings resolution + the descriptor-driven admin catalog
 * (MS2). Thin — validate + delegate. `CATALOG_GET` returns the whole catalog (descriptors +
 * resolved values); `SET` validates + persists a batch then returns the fresh catalog.
 */
@Controller()
export class SettingsMessageController {
  constructor(
    private readonly resolver: SettingsResolver,
    private readonly catalog: SettingsCatalogService,
    private readonly writer: SettingsWriter,
  ) {}

  @MessagePattern(SETTINGS_CATALOG_GET)
  getCatalog(
    @Payload(new ZodValidationPipe(resolveScopeSchema)) ctx: ResolveScope,
  ): Promise<SettingsCatalog> {
    return this.catalog.getCatalog(ctx);
  }

  // The audit interceptor opens the actor scope around this handler from the forwarded RMQ
  // headers (MS4 + P8.8), so `SettingsWriter` records WHAT changed and never plumbs an actor.
  @Audited({ action: 'settings.updated', entityType: 'setting' })
  @MessagePattern(SETTINGS_SET)
  async set(
    @Payload(new ZodValidationPipe(settingsUpdateRequestSchema))
    body: SettingsUpdateRequest,
  ): Promise<SettingsCatalog> {
    await this.writer.setMany(body.values, { scope: 'global' });
    return this.catalog.getCatalog({ scope: 'global' });
  }

  @MessagePattern(SETTINGS_RESOLVE)
  resolve(
    @Payload(new ZodValidationPipe(resolveRequestSchema)) input: ResolveRequest,
  ): Promise<ResolvedValue> {
    return this.resolver.resolveKey(input.key, {
      scope: input.scope,
      scopeId: input.scopeId,
    });
  }

  @MessagePattern(SETTINGS_RESOLVE_GROUP)
  resolveGroup(
    @Payload(new ZodValidationPipe(resolveGroupRequestSchema))
    input: ResolveGroupRequest,
  ): Promise<Record<string, ResolvedValue>> {
    return this.resolver.resolveGroup(input.group, {
      scope: input.scope,
      scopeId: input.scopeId,
    });
  }
}
