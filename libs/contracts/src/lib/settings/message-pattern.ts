/**
 * The canonical RMQ request/reply patterns the gateway sends and the settings
 * service answers (MS2). Defined once so caller and responder never drift (U3).
 * `<service>.<resource>.<action>` convention.
 */
export const SETTINGS_BRANDING_GET = 'settings.branding.get';
export const SETTINGS_BRANDING_UPDATE = 'settings.branding.update';
export const SETTINGS_RESOLVE = 'settings.resolve';
export const SETTINGS_RESOLVE_GROUP = 'settings.group.resolve';

/**
 * Generic descriptor-driven settings (the admin settings page). `CATALOG_GET` returns the
 * whole catalog (groups → sections → fields with descriptor + resolved value) for a scope;
 * `SET` applies a batch of typed key→value writes. Both are gateway-guarded (`settings.read`
 * / `settings.manage`). Branding's public `GET /api/branding` resolve stays separate.
 */
export const SETTINGS_CATALOG_GET = 'settings.catalog.get';
export const SETTINGS_SET = 'settings.set';

/**
 * Integrations patterns (N13, the capability→providers rework). `STATUS` backs the admin page
 * (masked, `settings.integrations.read`); `CONFIGURE`/`ACTIVATE` are gateway-guarded by the
 * capability's manage permission. `RESOLVE` is **internal-only** — a consuming service
 * (media/notifications) request/replies for the DECRYPTED config of the active (or a named)
 * provider; it is NEVER exposed on the gateway.
 */
export const SETTINGS_INTEGRATION_STATUS = 'settings.integration.status';
export const SETTINGS_INTEGRATION_CONFIGURE = 'settings.integration.configure';
export const SETTINGS_INTEGRATION_ACTIVATE = 'settings.integration.activate';
export const SETTINGS_INTEGRATION_RESOLVE = 'settings.integration.resolve';

/**
 * Domain event the settings service emits via the Outbox on a branding change
 * (MS3). No consumer yet; the website (P8) will subscribe to revalidate its cache.
 */
export const SETTINGS_CHANGED_EVENT = 'settings.changed';
