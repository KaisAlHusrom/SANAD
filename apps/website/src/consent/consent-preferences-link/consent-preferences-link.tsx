'use client';

import type { ConsentPreferencesCopy } from '../types/consent-copy.types';
import { useConsent } from '../use-consent/use-consent';
import { useConsentUi } from '../use-consent-ui/use-consent-ui';

interface ConsentPreferencesLinkProps {
  copy: ConsentPreferencesCopy;
  /** Each footer styles it as one of its own links; the behaviour is identical. */
  className?: string;
}

/**
 * "Cookie preferences", in both footers — the permanent affordance that makes a decision
 * revisable forever.
 *
 * It OPENS the dialog rather than withdrawing: withdrawing would reset a visitor to `pending`
 * just because they wanted to change one category, which is a bigger answer than they gave.
 *
 * It must exist in `SiteFooter` **and** in the landing finale: `site-chrome.css` hides the chrome
 * footer wherever `.lp-finale` renders, so a `SiteFooter`-only link is genuinely unreachable on
 * the landing page.
 */
export function ConsentPreferencesLink({
  copy,
  className,
}: ConsentPreferencesLinkProps) {
  const { status } = useConsent();
  const { openDialog } = useConsentUi();

  // With consent switched off there is nothing to configure, and offering preferences would imply
  // a choice the operator has removed.
  if (status === 'not-required') return null;

  return (
    <button
      type="button"
      className={className ?? 'consent-preferences-link'}
      onClick={openDialog}
    >
      {copy.open}
    </button>
  );
}
