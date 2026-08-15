import { identityToHeaders } from '@sanad/auth';
import type { IdentityContext, Locale } from '@sanad/contracts';
import { localeToHeaders } from '@sanad/i18n';
import { requestContextToHeaders } from '@sanad/messaging';
import { currentRequestContext } from '../../middlewares/request-context/request-context.middleware.js';

/**
 * The RMQ headers the gateway attaches to EVERY `sendRequest` (the one place all three are built):
 * the JWT-validated identity the service trusts (MS4), the **caller's locale** (U24) so a service
 * can localize text that lives inside its payload, and the **caller's circumstances** — ip,
 * user-agent, request id (P8.8) — which only this HTTP edge can see and which an audit row cannot
 * be reconstructed without.
 *
 * The context is read from the ambient request scope rather than passed in: this function has ~26
 * call sites, and taking it as a parameter would mean every future audited route had to remember
 * to thread it. `null` identity is a public route, which forwards locale + context alone.
 */
export function forwardHeaders(
  identity: IdentityContext | null,
  locale: Locale,
): Record<string, string> {
  return {
    ...(identity ? identityToHeaders(identity) : {}),
    ...localeToHeaders(locale),
    ...requestContextToHeaders(currentRequestContext()),
  };
}
