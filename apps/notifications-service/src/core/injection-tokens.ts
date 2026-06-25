/**
 * DI token for the RMQ ClientProxy this service uses to request/reply the settings service
 * (MS2) — currently to resolve the SMTP password from the integration-secret vault (N13).
 */
export const SETTINGS_CLIENT = 'SETTINGS_CLIENT';
