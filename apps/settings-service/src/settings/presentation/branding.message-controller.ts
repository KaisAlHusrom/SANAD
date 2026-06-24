import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import {
  brandingUpdateRequestSchema,
  resolveScopeSchema,
  SETTINGS_BRANDING_GET,
  SETTINGS_BRANDING_UPDATE,
  type BrandingRecord,
  type BrandingUpdateRequest,
  type ResolveScope,
} from '@sanad/contracts';
import { ZodValidationPipe } from '@sanad/util';
import { BrandingService } from '../application/branding.service.js';

/**
 * RMQ entrypoints for branding (MS2). Thin — validate the payload and delegate (U5).
 * The gateway makes GET public and guards UPDATE with `settings.manage` at the edge
 * (MS4); the service trusts that and just reads/writes.
 */
@Controller()
export class BrandingMessageController {
  constructor(private readonly branding: BrandingService) {}

  @MessagePattern(SETTINGS_BRANDING_GET)
  get(
    @Payload(new ZodValidationPipe(resolveScopeSchema)) ctx: ResolveScope,
  ): Promise<BrandingRecord> {
    return this.branding.getBranding(ctx);
  }

  @MessagePattern(SETTINGS_BRANDING_UPDATE)
  update(
    @Payload(new ZodValidationPipe(brandingUpdateRequestSchema))
    body: BrandingUpdateRequest,
  ): Promise<BrandingRecord> {
    return this.branding.updateBranding(body, { scope: 'global' });
  }
}
