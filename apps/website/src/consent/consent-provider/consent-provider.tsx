'use client';

import { createContext, type ReactNode } from 'react';
import {
  DEFAULT_TRACKING_CONFIG,
  type PublicConsentPolicy,
} from '@sanad/contracts';
import { ConsentStatusMirror } from '../consent-status-mirror/consent-status-mirror';

/**
 * The resolved policy travels by context, not by module singleton: a singleton is shared across
 * requests on the server, and the store deliberately holds only browser storage state.
 *
 * The default is the coded default (F7) — a consumer rendered outside a provider gets "ask, and
 * grant nothing", which is the safe answer rather than a crash.
 */
export const ConsentPolicyContext = createContext<PublicConsentPolicy>(
  DEFAULT_TRACKING_CONFIG.consent,
);

export function ConsentProvider({
  policy,
  children,
}: {
  policy: PublicConsentPolicy;
  children: ReactNode;
}) {
  return (
    <ConsentPolicyContext.Provider value={policy}>
      <ConsentStatusMirror />
      {children}
    </ConsentPolicyContext.Provider>
  );
}
