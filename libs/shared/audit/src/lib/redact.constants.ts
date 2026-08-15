/** What a masked value is replaced with — a marker, so a reader sees the field EXISTED. */
export const REDACTED = '[redacted]';

/**
 * Substrings that make a key a secret. Deny-by-default on the VALUE would be guesswork; keys
 * are what we actually know. Matched case-insensitively against a lower-cased key, so
 * `SMTP_PASSWORD`, `accessToken` and `client_secret` all hit.
 */
export const SECRET_KEY_PATTERNS = [
  'password',
  'passwd',
  'secret',
  'token',
  'apikey',
  'api_key',
  'accesskey',
  'access_key',
  'privatekey',
  'private_key',
  'credential',
  'authorization',
  'otp',
  'pin',
] as const;

/** How deep the walker follows an object graph before it stops (U18). */
export const MAX_REDACT_DEPTH = 12;
