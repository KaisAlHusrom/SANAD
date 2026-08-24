'use client';

import { useEffect } from 'react';
import { CONSENT_STATUS_ATTRIBUTE } from '../constants/consent.constants';
import { useConsent } from '../use-consent/use-consent';

/**
 * Keeps `<html data-consent>` truthful after the bootstrap script stamped it. The script sets it
 * before first paint; without this the attribute would still say `pending` for the rest of the
 * session after a visitor decided, and an attribute that lies is worse than no attribute at all.
 *
 * Renders nothing — it exists so the provider can hold the context and this can consume it.
 */
export function ConsentStatusMirror(): null {
  const { status } = useConsent();

  useEffect(() => {
    document.documentElement.setAttribute(CONSENT_STATUS_ATTRIBUTE, status);
  }, [status]);

  return null;
}
