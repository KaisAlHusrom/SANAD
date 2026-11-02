'use client';

import { createContext, type ReactNode } from 'react';
import {
  DEFAULT_TRACKING_CONFIG,
  type PublicTrackingConfig,
} from '@sanad/contracts';
import { ConsentStatusMirror } from '../consent-status-mirror/consent-status-mirror';

/**
 * The resolved tracking config travels by context, not by module singleton: a singleton is shared
 * across requests on the server, and the store deliberately holds only browser storage state.
 *
 * It carries the whole config rather than just the consent policy because the preferences dialog
 * names the destinations a category would actually admit — a visitor is owed the list of third
 * parties, not an abstraction — and A3's loaders read the same list.
 *
 * The default is the coded default (F7) — a consumer rendered outside a provider gets "ask, grant
 * nothing, load nothing", which is the safe answer rather than a crash.
 */
export const ConsentConfigContext = createContext<PublicTrackingConfig>(
  DEFAULT_TRACKING_CONFIG,
);

export function ConsentProvider({
  config,
  children,
}: {
  config: PublicTrackingConfig;
  children: ReactNode;
}) {
  return (
    <ConsentConfigContext.Provider value={config}>
      <ConsentStatusMirror />
      {children}
    </ConsentConfigContext.Provider>
  );
}
