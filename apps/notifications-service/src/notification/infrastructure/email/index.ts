// The email-delivery seam (N13) — abstract provider, console + SMTP impls, the credentials
// resolver, and the lead email templates. Barrel only (U10).
export * from './email.provider.js';
export * from './console-email.provider.js';
export * from './smtp-email.provider.js';
export * from './smtp-credentials.js';
export * from './templates/lead-email-templates.js';
