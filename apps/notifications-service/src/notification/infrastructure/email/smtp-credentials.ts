import type { ClientProxy } from '@nestjs/microservices';
import { SETTINGS_RESOLVE_SECRET } from '@sanad/contracts';
import { sendRequest } from '@sanad/messaging';
import type { NotificationsEnv } from '../../../env.js';

/**
 * The SMTP-password credentials seam (the email analog of media's `getStorageCredentials`).
 * Resolves the secret **DB → env → null** (N13): first the settings vault over RMQ
 * (`settings.resolve-secret`, MS2, with the request helper's timeout + catchError), then the
 * service's own `SMTP_PASSWORD` env fallback. Returns null when neither is set (→ the
 * provider logs instead of sending). Keeping this one function isolates the future
 * env→vault-only swap to a single place.
 */
export async function resolveSmtpPassword(
  client: ClientProxy,
  env: NotificationsEnv,
): Promise<string | null> {
  try {
    const fromVault = await sendRequest<string | null>(
      client,
      SETTINGS_RESOLVE_SECRET,
      { key: 'SMTP_PASSWORD' },
    );
    if (fromVault) {
      return fromVault;
    }
  } catch {
    // Settings unreachable / no responder — fall through to the env fallback.
  }
  return env.SMTP_PASSWORD ?? null;
}
