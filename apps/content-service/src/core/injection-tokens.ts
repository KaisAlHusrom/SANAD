/**
 * DI token for the RMQ ClientProxy this service uses to request/reply the settings service
 * (MS2) — currently to resolve the lead duplicate-detection window (P8.10.B2), which is an
 * operator-tunable value rather than a constant.
 */
export const SETTINGS_CLIENT = 'SETTINGS_CLIENT';
