import { Controller } from '@nestjs/common';
import {
  Ctx,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { identityFromHeaders } from '@sanad/auth';
import {
  integrationActivatePayloadSchema,
  integrationConfigurePayloadSchema,
  integrationResolvePayloadSchema,
  SETTINGS_INTEGRATION_ACTIVATE,
  SETTINGS_INTEGRATION_CONFIGURE,
  SETTINGS_INTEGRATION_RESOLVE,
  SETTINGS_INTEGRATION_STATUS,
  type IntegrationActivatePayload,
  type IntegrationCapabilityStatus,
  type IntegrationConfigurePayload,
  type IntegrationResolvePayload,
  type ResolvedIntegrationConfig,
} from '@sanad/contracts';
import { readMessageHeaders } from '@sanad/messaging';
import { ZodValidationPipe } from '@sanad/util';
import { IntegrationsService } from '../application/integrations.service.js';

/**
 * RMQ entrypoints for the integrations surface (MS2, N13). Thin — validate + delegate (U5).
 * `resolve` is INTERNAL only (no gateway route): it returns the DECRYPTED provider config over
 * the broker to a server-side consumer (media/notifications). `status`/`configure`/`activate`
 * back the masked admin surface; the gateway guards them per capability and forwards the
 * validated identity in headers (MS4).
 */
@Controller()
export class IntegrationMessageController {
  constructor(private readonly integrations: IntegrationsService) {}

  @MessagePattern(SETTINGS_INTEGRATION_STATUS)
  status(): Promise<IntegrationCapabilityStatus[]> {
    return this.integrations.getStatuses();
  }

  @MessagePattern(SETTINGS_INTEGRATION_CONFIGURE)
  async configure(
    @Payload(new ZodValidationPipe(integrationConfigurePayloadSchema))
    payload: IntegrationConfigurePayload,
    @Ctx() context: RmqContext,
  ): Promise<IntegrationCapabilityStatus[]> {
    const identity = identityFromHeaders(readMessageHeaders(context));
    await this.integrations.configureProvider(
      payload.capability,
      payload.provider,
      payload.values,
      identity?.userId ?? null,
    );
    return this.integrations.getStatuses();
  }

  @MessagePattern(SETTINGS_INTEGRATION_ACTIVATE)
  async activate(
    @Payload(new ZodValidationPipe(integrationActivatePayloadSchema))
    payload: IntegrationActivatePayload,
    @Ctx() context: RmqContext,
  ): Promise<IntegrationCapabilityStatus[]> {
    const identity = identityFromHeaders(readMessageHeaders(context));
    await this.integrations.activateProvider(
      payload.capability,
      payload.provider,
      identity?.userId ?? null,
    );
    return this.integrations.getStatuses();
  }

  @MessagePattern(SETTINGS_INTEGRATION_RESOLVE)
  resolve(
    @Payload(new ZodValidationPipe(integrationResolvePayloadSchema))
    payload: IntegrationResolvePayload,
  ): Promise<ResolvedIntegrationConfig | null> {
    return this.integrations.resolveConfig(
      payload.capability,
      payload.provider,
    );
  }
}
