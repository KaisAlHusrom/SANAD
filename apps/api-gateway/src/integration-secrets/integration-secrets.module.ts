import { Module } from '@nestjs/common';
import { IntegrationSecretController } from './integration-secret.controller.js';

/**
 * The integration-secret admin surface (N13 — gated per-integration). Masked status reads
 * need `settings.secrets.read`; set/rotate is gated per third party by the
 * `SecretPermissionGuard`. Uses the global CoreModule's SETTINGS_CLIENT.
 */
@Module({
  controllers: [IntegrationSecretController],
})
export class IntegrationSecretsModule {}
