import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { BrandingModule } from './branding/branding.module.js';
import { ContentModule } from './content/content.module.js';
import { CoreModule } from './core/core.module.js';
import { HealthModule } from './health/health.module.js';
import { IntegrationSecretsModule } from './integration-secrets/integration-secrets.module.js';
import { MediaModule } from './media/media.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { UsersModule } from './users/users.module.js';

/**
 * Root gateway module (MS4). CoreModule (global) provides the identity + settings + media
 * RMQ clients + token verifier; feature modules add the public auth routes, the
 * RBAC-guarded users route, the branding surface (public read + guarded write), the media
 * surface (signed upload + library), the content surface (public CMS reads + guarded writes
 * + public lead submit), and health.
 */
@Module({
  imports: [
    CoreModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BrandingModule,
    MediaModule,
    ContentModule,
    IntegrationSecretsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
