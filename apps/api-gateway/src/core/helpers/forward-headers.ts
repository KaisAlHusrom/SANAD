import { identityToHeaders } from '@sanad/auth';
import type { IdentityContext, Locale } from '@sanad/contracts';
import { localeToHeaders } from '@sanad/i18n';

/**
 * The RMQ headers the gateway attaches to EVERY `sendRequest` (the one place both are built):
 * the JWT-validated identity the service trusts (MS4) plus the **caller's locale** (U24), so a
 * service can localize text that lives inside its payload — an integration test result, an
 * email body — exactly as the edge localizes the envelope.
 *
 * `identity` is `null` for a public route, which forwards the locale alone.
 */
export function forwardHeaders(
  identity: IdentityContext | null,
  locale: Locale,
): Record<string, string> {
  return {
    ...(identity ? identityToHeaders(identity) : {}),
    ...localeToHeaders(locale),
  };
}
