/**
 * DI token for the RMQ ClientProxy this service uses to request/reply the settings service
 * (MS2) — to resolve the Cloudflare R2 credentials/config from the integration-secret vault
 * (N13). Mirrors the notifications-service SMTP seam. Resolution is vault → media env → null,
 * so R2 is admin-configurable from the Integrations page without a redeploy.
 */
export const SETTINGS_CLIENT = 'SETTINGS_CLIENT';
