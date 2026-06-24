import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  resolveGroupRequestSchema,
  resolveRequestSchema,
  SETTINGS_RESOLVE,
  SETTINGS_RESOLVE_GROUP,
  type ResolveGroupRequest,
  type ResolveRequest,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import type { ResolvedValue } from '../application/resolved-value.js';
import { SettingsResolver } from '../application/settings.resolver.js';

/**
 * RMQ entrypoints for generic settings resolution (MS2). Thin — validate + delegate to
 * the resolver (override → global → coded default, U9).
 */
@Controller()
export class SettingsMessageController {
  constructor(private readonly resolver: SettingsResolver) {}

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
