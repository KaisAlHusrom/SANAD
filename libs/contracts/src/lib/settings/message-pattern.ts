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
 * Domain event the settings service emits via the Outbox on a branding change
 * (MS3). No consumer yet; the website (P8) will subscribe to revalidate its cache.
 */
export const SETTINGS_CHANGED_EVENT = 'settings.changed';
