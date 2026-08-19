import { Module } from '@nestjs/common';
import { CacheModule } from '@sanad/cache';
import { AuthModule } from './auth/auth.module.js';
import { BrandingModule } from './branding/branding.module.js';
import { ContentModule } from './content/content.module.js';
import { CoreModule } from './core/core.module.js';
import { DashboardModule } from './dashboard/dashboard.module.js';
import { HealthModule } from './health/health.module.js';
import { IntegrationsModule } from './integrations/integrations.module.js';
import { MediaModule } from './media/media.module.js';
import { NotificationsModule } from './notifications/notifications.module.js';
import { loadGatewayEnv } from './env.js';
import { SecurityModule } from './security/security.module.js';
import { SettingsModule } from './settings/settings.module.js';
import { UsersModule } from './users/users.module.js';

/**
 * Root gateway module (MS4). CoreModule (global) provides the identity + settings + media
 * RMQ clients + token verifier; feature modules add the public auth routes, the
 * RBAC-guarded users route, the branding surface (public read + guarded write), the media
 * surface (signed upload + library), the content surface (public CMS reads + guarded writes
 * + public lead submit), and health. `SecurityModule` binds the global rate-limit guard
 * (P8.10.A); `CacheModule` backs it with the Redis counter.
 */
// Validated once at module load (U19), same as `core.module.ts`.
const env = loadGatewayEnv();

@Module({
  imports: [
    CoreModule,
    CacheModule.forRoot({ url: env.REDIS_URL }),
    SecurityModule,
    HealthModule,
    AuthModule,
    UsersModule,
    BrandingModule,
    SettingsModule,
    MediaModule,
    ContentModule,
    IntegrationsModule,
    NotificationsModule,
    DashboardModule,
  ],
})
export class AppModule {}
