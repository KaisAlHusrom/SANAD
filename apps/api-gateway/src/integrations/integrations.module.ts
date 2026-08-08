import { Module } from '@nestjs/common';
import { IntegrationController } from './integration.controller.js';

/**
 * The integrations admin surface (N13 — capability→providers→active). Masked catalog reads need
 * `settings.integrations.read`; configure/activate/test are gated per capability by the
 * `IntegrationPermissionGuard`. Uses the global CoreModule's SETTINGS/MEDIA/NOTIFICATIONS clients
 * (test is routed to the capability's owning service, MS1).
 */
@Module({
  controllers: [IntegrationController],
})
export class IntegrationsModule {}
